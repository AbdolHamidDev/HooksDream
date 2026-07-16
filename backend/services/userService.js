// services/userService.js - Business logic for users
const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const Notification = require('../models/Notification');
const cloudinary = require('cloudinary').v2;

class UserService {
  /**
   * Get user profile by hashId
   */
  static async getProfile(hashId, requesterId = null) {
    const user = await User.findOne({ hashId, isDeleted: false });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get follower/following counts
    const followerCount = await Follow.countDocuments({ 
      following: user._id, 
      isDeleted: false 
    });
    
    const followingCount = await Follow.countDocuments({ 
      follower: user._id, 
      isDeleted: false 
    });

    // Get post count
    const postCount = await Post.countDocuments({ 
      userId: user._id, 
      isDeleted: false,
      $or: [
        { isArchived: false },
        { isArchived: { $exists: false } }
      ]
    });

    // Check if requester is following
    let isFollowing = false;
    if (requesterId && requesterId !== user._id) {
      const follow = await Follow.findOne({
        follower: requesterId,
        following: user._id,
        isDeleted: false
      });
      isFollowing = !!follow;
    }

    return {
      ...user.toObject(),
      followerCount,
      followingCount,
      postCount,
      isFollowing,
      isOwnProfile: requesterId === user._id
    };
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Update allowed fields
    const allowedFields = [
      'username', 'displayName', 'bio', 'location', 
      'website', 'phone', 'pronouns'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    // Handle avatar upload
    if (updateData.avatarBase64) {
      try {
        const uploadResult = await cloudinary.uploader.upload(
          updateData.avatarBase64,
          {
            folder: 'hooksdream/avatars',
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto' }
            ]
          }
        );
        user.avatar = uploadResult.secure_url;
      } catch (error) {
        console.error('Avatar upload failed:', error);
        throw new Error('Failed to upload avatar');
      }
    }

    // Handle cover image upload
    if (updateData.coverImageBase64) {
      try {
        const uploadResult = await cloudinary.uploader.upload(
          updateData.coverImageBase64,
          {
            folder: 'hooksdream/covers',
            transformation: [
              { width: 1200, height: 400, crop: 'fill' },
              { quality: 'auto' }
            ]
          }
        );
        user.coverImage = uploadResult.secure_url;
      } catch (error) {
        console.error('Cover image upload failed:', error);
        throw new Error('Failed to upload cover image');
      }
    }

    await user.save();
    
    return user;
  }

  /**
   * Search users
   */
  static async searchUsers(params = {}) {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      sortBy = 'popular'
    } = params;

    let query = { isDeleted: false };

    // Search in username, displayName, email
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { displayName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    switch (sortBy) {
      case 'popular':
        sortOption = { followerCount: -1, createdAt: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
    }

    const users = await User.find(query)
      .select('username displayName avatar bio followerCount followingCount postCount isVerified createdAt')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    return {
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get popular users
   */
  static async getPopularUsers(limit = 20) {
    const users = await User.find({ isDeleted: false })
      .select('username displayName avatar bio followerCount followingCount postCount isVerified')
      .sort({ followerCount: -1, postCount: -1 })
      .limit(limit)
      .lean();

    return users;
  }

  /**
   * Get user stats
   */
  static async getUserStats(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const [postCount, followerCount, followingCount] = await Promise.all([
      Post.countDocuments({ userId, isDeleted: false }),
      Follow.countDocuments({ following: userId, isDeleted: false }),
      Follow.countDocuments({ follower: userId, isDeleted: false })
    ]);

    return {
      postCount,
      followerCount,
      followingCount
    };
  }

  /**
   * Delete user account (soft delete)
   */
  static async deleteUser(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete user
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    // Anonymize user data (GDPR compliance)
    user.email = `deleted_${userId}@deleted.com`;
    user.username = `deleted_user_${userId.slice(0, 8)}`;
    user.displayName = 'Deleted User';
    user.avatar = null;
    user.bio = '';
    user.phone = '';
    user.website = '';
    user.location = '';
    await user.save();

    return { success: true, message: 'User deleted successfully' };
  }
}

module.exports = UserService;