// services/postService.js - Business logic for posts
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const cloudinary = require('cloudinary').v2;

class PostService {
  /**
   * Get posts feed with pagination and sorting
   */
  static async getPosts(params = {}) {
    const { page = 1, limit = 10, sort = 'latest' } = params;
    
    let query = { 
      isDeleted: false, 
      $or: [
        { isArchived: false },
        { isArchived: { $exists: false } }
      ],
      visibility: 'public' 
    };
    
    let sortOption = { createdAt: -1 };
    
    switch (sort) {
      case 'trending':
        sortOption = { engagementScore: -1, createdAt: -1 };
        break;
      case 'popular':
        sortOption = { likeCount: -1, createdAt: -1 };
        break;
      case 'latest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }
    
    const posts = await Post.find(query)
      .populate('userId', 'username displayName avatar isVerified')
      .populate('originalPost')
      .populate({
        path: 'repost_of',
        populate: {
          path: 'userId',
          select: 'username displayName avatar isVerified'
        }
      })
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    // Get comment counts
    for (let post of posts) {
      if (post.commentCount === undefined) {
        post.commentCount = await Comment.countDocuments({
          postId: post._id,
          isDeleted: false
        });
      }
    }
    
    const total = await Post.countDocuments(query);
    const currentPage = parseInt(page);
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: posts,
      pagination: {
        page: currentPage,
        limit: parseInt(limit),
        total,
        pages: totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
    };
  }

  /**
   * Create a new post
   */
  static async createPost(userId, postData) {
    const { content, images, video, visibility = 'public' } = postData;
    
    if ((!content || content.trim().length === 0) && 
        (!images || images.length === 0) && 
        (!video || video.trim().length === 0)) {
      throw new Error('Content, image or video is required');
    }
    
    const post = new Post({
      userId,
      content: content ? content.trim() : '',
      images: images || [],
      video: video || '',
      visibility,
    });
    
    await post.save();
    await post.populate('userId', 'username displayName avatar isVerified');
    await User.findByIdAndUpdate(userId, { $inc: { postCount: 1 } });
    
    return post;
  }

  /**
   * Delete a post with cleanup
   */
  static async deletePost(postId, userId) {
    const post = await Post.findOne({
      _id: postId,
      isDeleted: false
    });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (post.userId !== userId) {
      throw new Error('Access denied');
    }
    
    // Delete media from Cloudinary
    await this._deleteMediaFromCloudinary(post);
    
    // Handle reposts
    await this._handleRepostCleanup(post);
    
    // Hard delete from MongoDB
    await Post.findByIdAndDelete(postId);
    
    // Delete related comments
    await Comment.deleteMany({ postId });
    
    // Delete related notifications
    await Notification.deleteMany({ 
      $or: [
        { 'metadata.postId': postId },
        { entityId: postId }
      ]
    });
    
    // Update user post count
    await User.findByIdAndUpdate(userId, { $inc: { postCount: -1 } });
    
    return { success: true, message: 'Post deleted successfully' };
  }

  /**
   * Archive post (soft delete with TTL)
   */
  static async archivePost(postId, userId) {
    const post = await Post.findOne({ _id: postId });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (post.userId !== userId) {
      throw new Error('Access denied');
    }
    
    if (post.isArchived) {
      throw new Error('Post is already archived');
    }
    
    await post.archivePost();
    
    return {
      success: true,
      message: 'Post archived successfully',
      data: {
        archivedAt: post.archivedAt,
        expiresAt: post.expiresAt
      }
    };
  }

  /**
   * Restore archived post
   */
  static async restorePost(postId, userId) {
    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
      isArchived: true
    });
    
    if (!post) {
      throw new Error('Archived post not found');
    }
    
    if (post.userId !== userId) {
      throw new Error('Access denied');
    }
    
    await post.restorePost();
    
    return { success: true, message: 'Post restored successfully' };
  }

  /**
   * Get user posts
   */
  static async getUserPosts(userId, params = {}) {
    const { page = 1, limit = 10 } = params;
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    let query = { 
      userId,
      isDeleted: false,
      $or: [
        { isArchived: false },
        { isArchived: { $exists: false } }
      ]
    };
    
    // If not the owner, only show public posts
    if (params.requesterId && params.requesterId !== userId) {
      query.visibility = 'public';
    }
    
    const posts = await Post.find(query)
      .populate('userId', 'username displayName avatar isVerified')
      .populate('originalPost')
      .populate({
        path: 'repost_of',
        populate: {
          path: 'userId',
          select: 'username displayName avatar isVerified'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Post.countDocuments(query);
    
    return {
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Helper: Delete media from Cloudinary
   */
  static async _deleteMediaFromCloudinary(post) {
    try {
      if (post.images && post.images.length > 0) {
        for (const imageUrl of post.images) {
          try {
            const publicId = this._extractPublicId(imageUrl);
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            console.error('Error deleting image:', error);
          }
        }
      }
      
      if (post.video) {
        try {
          const publicId = this._extractPublicId(post.video);
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        } catch (error) {
          console.error('Error deleting video:', error);
        }
      }
    } catch (error) {
      console.error('Cloudinary deletion failed:', error);
    }
  }

  /**
   * Helper: Handle repost cleanup
   */
  static async _handleRepostCleanup(post) {
    if (post.repost_of) {
      try {
        await Post.findByIdAndUpdate(post.repost_of, { 
          $inc: { repostCount: -1 } 
        });
      } catch (error) {
        console.error('Error updating original post repost count:', error);
      }
    }
    
    if (!post.repost_of) {
      try {
        const reposts = await Post.find({ repost_of: post._id });
        await Post.updateMany(
          { repost_of: post._id },
          { $set: { originalPostDeleted: true } }
        );
      } catch (error) {
        console.error('Error handling reposts:', error);
      }
    }
  }

  /**
   * Helper: Extract public ID from Cloudinary URL
   */
  static _extractPublicId(url) {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    return filename.split('.')[0];
  }
}

module.exports = PostService;