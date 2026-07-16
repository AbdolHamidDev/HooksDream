// services/commentService.js - Business logic for comments
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

class CommentService {
  /**
   * Get comments for a post
   */
  static async getComments(postId, params = {}) {
    const { page = 1, limit = 20 } = params;

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const comments = await Comment.find({
      postId,
      isDeleted: false,
      parentComment: null // Only top-level comments
    })
      .populate('userId', 'username displayName avatar isVerified')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get reply counts
    for (const comment of comments) {
      comment.replyCount = await Comment.countDocuments({
        parentComment: comment._id,
        isDeleted: false
      });
    }

    const total = await Comment.countDocuments({
      postId,
      isDeleted: false,
      parentComment: null
    });

    return {
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create comment
   */
  static async createComment(userId, postId, commentData) {
    const { content, image, parentCommentId } = commentData;

    if (!content && !image) {
      throw new Error('Comment content or image is required');
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // If it's a reply, verify parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        throw new Error('Parent comment not found');
      }
    }

    const comment = new Comment({
      userId,
      postId,
      content: content || '',
      image: image || '',
      parentComment: parentCommentId || null
    });

    await comment.save();
    await comment.populate('userId', 'username displayName avatar isVerified');

    // Update post comment count
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    // Create notification for post owner (if not commenting on own post)
    if (post.userId !== userId && !parentCommentId) {
      await Notification.create({
        userId: post.userId,
        type: 'comment',
        entityId: postId,
        entityType: 'post',
        actorId: userId,
        message: 'commented on your post'
      });
    }

    // Create notification for parent comment owner (if it's a reply)
    if (parentCommentId && parentComment.userId !== userId) {
      await Notification.create({
        userId: parentComment.userId,
        type: 'reply',
        entityId: postId,
        entityType: 'comment',
        actorId: userId,
        message: 'replied to your comment'
      });
    }

    return comment;
  }

  /**
   * Update comment
   */
  static async updateComment(commentId, userId, updateData) {
    const comment = await Comment.findOne({
      _id: commentId,
      userId,
      isDeleted: false
    });

    if (!comment) {
      throw new Error('Comment not found or access denied');
    }

    if (updateData.content !== undefined) {
      comment.content = updateData.content;
      comment.isEdited = true;
    }

    if (updateData.image !== undefined) {
      comment.image = updateData.image;
    }

    await comment.save();
    await comment.populate('userId', 'username displayName avatar isVerified');

    return comment;
  }

  /**
   * Delete comment (soft delete)
   */
  static async deleteComment(commentId, userId) {
    const comment = await Comment.findOne({
      _id: commentId,
      userId,
      isDeleted: false
    });

    if (!comment) {
      throw new Error('Comment not found or access denied');
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    // Update post comment count
    await Post.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });

    return { success: true, message: 'Comment deleted successfully' };
  }

  /**
   * Like/unlike comment
   */
  static async toggleLike(commentId, userId) {
    const comment = await Comment.findOne({
      _id: commentId,
      isDeleted: false
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      // Unlike
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      comment.likes.push(userId);

      // Create notification
      if (comment.userId !== userId) {
        await Notification.create({
          userId: comment.userId,
          type: 'like',
          entityId: commentId,
          entityType: 'comment',
          actorId: userId,
          message: 'liked your comment'
        });
      }
    }

    await comment.save();

    return {
      isLiked: !isLiked,
      likesCount: comment.likes.length
    };
  }

  /**
   * Get replies to a comment
   */
  static async getReplies(commentId, params = {}) {
    const { page = 1, limit = 10 } = params;

    const replies = await Comment.find({
      parentComment: commentId,
      isDeleted: false
    })
      .populate('userId', 'username displayName avatar isVerified')
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Comment.countDocuments({
      parentComment: commentId,
      isDeleted: false
    });

    return {
      data: replies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get comment stats for a post
   */
  static async getCommentStats(postId) {
    const totalComments = await Comment.countDocuments({
      postId,
      isDeleted: false,
      parentComment: null
    });

    const totalReplies = await Comment.countDocuments({
      postId,
      isDeleted: false,
      parentComment: { $ne: null }
    });

    const topCommenters = await Comment.aggregate([
      {
        $match: {
          postId: require('mongoose').Types.ObjectId(postId),
          isDeleted: false,
          parentComment: null
        }
      },
      {
        $group: {
          _id: '$userId',
          commentCount: { $sum: 1 }
        }
      },
      {
        $sort: { commentCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          username: '$user.username',
          displayName: '$user.displayName',
          avatar: '$user.avatar',
          commentCount: 1
        }
      }
    ]);

    return {
      totalComments,
      totalReplies,
      topCommenters
    };
  }
}

module.exports = CommentService;