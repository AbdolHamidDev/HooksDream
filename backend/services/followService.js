// services/followService.js - Business logic for follows
const Follow = require('../models/Follow');
const User = require('../models/User');
const Notification = require('../models/Notification');

class FollowService {
  /**
   * Follow a user
   */
  static async followUser(followerId, followingId) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId,
      isDeleted: false
    });

    if (existingFollow) {
      throw new Error('Already following this user');
    }

    // Create follow
    const follow = new Follow({
      follower: followerId,
      following: followingId
    });

    await follow.save();

    // Create notification
    await Notification.create({
      userId: followingId,
      type: 'follow',
      entityId: followerId,
      entityType: 'user',
      actorId: followerId,
      message: 'started following you'
    });

    return follow;
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(followerId, followingId) {
    const follow = await Follow.findOne({
      follower: followerId,
      following: followingId,
      isDeleted: false
    });

    if (!follow) {
      throw new Error('Not following this user');
    }

    // Soft delete
    follow.isDeleted = true;
    follow.deletedAt = new Date();
    await follow.save();

    return { success: true, message: 'Unfollowed successfully' };
  }

  /**
   * Get followers of a user
   */
  static async getFollowers(userId, params = {}) {
    const { page = 1, limit = 20 } = params;

    const followers = await Follow.find({
      following: userId,
      isDeleted: false
    })
      .populate('follower', 'username displayName avatar bio followerCount followingCount postCount isVerified')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Follow.countDocuments({
      following: userId,
      isDeleted: false
    });

    return {
      data: followers.map(f => f.follower),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get users that a user is following
   */
  static async getFollowing(userId, params = {}) {
    const { page = 1, limit = 20 } = params;

    const following = await Follow.find({
      follower: userId,
      isDeleted: false
    })
      .populate('following', 'username displayName avatar bio followerCount followingCount postCount isVerified')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Follow.countDocuments({
      follower: userId,
      isDeleted: false
    });

    return {
      data: following.map(f => f.following),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Check if user1 is following user2
   */
  static async checkFollowStatus(followerId, followingId) {
    const follow = await Follow.findOne({
      follower: followerId,
      following: followingId,
      isDeleted: false
    });

    return {
      isFollowing: !!follow,
      followedAt: follow?.createdAt || null
    };
  }

  /**
   * Get mutual followers between two users
   */
  static async getMutualFollowers(userId1, userId2, params = {}) {
    const { page = 1, limit = 20 } = params;

    // Get followers of user1
    const user1Followers = await Follow.find({
      following: userId1,
      isDeleted: false
    }).select('follower');

    const user1FollowerIds = user1Followers.map(f => f.follower.toString());

    // Get followers of user2
    const user2Followers = await Follow.find({
      following: userId2,
      isDeleted: false
    }).select('follower');

    // Find mutual followers
    const mutualFollowerIds = user2Followers
      .filter(f => user1FollowerIds.includes(f.follower.toString()))
      .map(f => f.follower);

    // Get user details
    const users = await User.find({
      _id: { $in: mutualFollowerIds }
    })
      .select('username displayName avatar bio followerCount followingCount postCount isVerified')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    return {
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mutualFollowerIds.length,
        pages: Math.ceil(mutualFollowerIds.length / limit)
      }
    };
  }

  /**
   * Get follow suggestions for a user
   */
  static async getFollowSuggestions(userId, limit = 10) {
    // Get users that the user is already following
    const following = await Follow.find({
      follower: userId,
      isDeleted: false
    }).select('following');

    const followingIds = following.map(f => f.following.toString());
    followingIds.push(userId.toString()); // Exclude self

    // Get popular users that the user is not following
    const suggestions = await User.find({
      _id: { $nin: followingIds },
      isDeleted: false
    })
      .select('username displayName avatar bio followerCount followingCount postCount isVerified')
      .sort({ followerCount: -1, postCount: -1 })
      .limit(limit)
      .lean();

    return suggestions;
  }

  /**
   * Get follow stats for a user
   */
  static async getFollowStats(userId) {
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: userId, isDeleted: false }),
      Follow.countDocuments({ follower: userId, isDeleted: false })
    ]);

    return {
      followersCount,
      followingCount
    };
  }
}

module.exports = FollowService;