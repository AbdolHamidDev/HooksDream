const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { createResponse } = require('../utils/helpers');
const linkPreviewService = require('../services/linkPreviewService');

// Get socket server instance for notifications
let socketServer = null;
const setSocketServer = (server) => {
    socketServer = server;
};

const getNotificationHelper = () => {
    return socketServer?.getNotificationHelper();
};

// Lấy danh sách posts (public feed)
exports.getPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'latest' } = req.query;
        
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
        
        // ✅ THÊM: Lấy commentCount cho mỗi post
        const Comment = require('../models/Comment');
        for (let post of posts) {
            if (post.commentCount === undefined) {
                post.commentCount = await Comment.countDocuments({
                    postId: post._id,
                    isDeleted: false
                });
            }
        }
        
        // Thêm thông tin user đã like hay chưa
        if (req.userId) {
            posts.forEach(post => {
                post.isLiked = post.likes.some(like => like.userId === req.userId);
            });
        }
        
        const total = await Post.countDocuments(query);
        const currentPage = parseInt(page);
        const totalPages = Math.ceil(total / limit);
        
        res.json({
            success: true,
            data: posts, // ✅ GIỜ ĐÃ CÓ commentCount
            pagination: {
                page: currentPage,
                limit: parseInt(limit),
                total,
                pages: totalPages,
                hasNext: currentPage < totalPages, // ⚡ THÊM hasNext cho frontend
                hasPrev: currentPage > 1
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Tạo post mới
exports.createPost = async (req, res) => {
    try {
        const { content, images, video, visibility = 'public' } = req.body;

        const postUserId = req.userId;
        
        if (!postUserId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Cập nhật validation để hỗ trợ video
        if ((!content || content.trim().length === 0) && 
            (!images || images.length === 0) && 
            (!video || video.trim().length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Content, image or video is required'
            });
        }

        const post = new Post({
            userId: postUserId,
            content: content ? content.trim() : '',
            images: images || [],
            video: video || '',
            visibility,
        });

        await post.save();
        await post.populate('userId', 'username displayName avatar isVerified');
        await User.findByIdAndUpdate(postUserId, { $inc: { postCount: 1 } });

        // Send notification to followers about new post
        const notificationHelper = getNotificationHelper();
        if (notificationHelper) {
            await notificationHelper.handleNewPostFromFollowing(post._id, postUserId);
        }

        // Emit real-time event for new post
        if (global.socketServer) {
            const postData = {
                post: post.toObject(),
                userId: postUserId,
                timestamp: new Date().toISOString()
            };
            
            // Broadcast to global feed
            global.socketServer.io.to('feed:global').emit('post:created', postData);
            
            // Broadcast to user's followers
            global.socketServer.io.to(`user:${postUserId}:posts`).emit('post:created', postData);
            
            }

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: post
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Lấy chi tiết một post
exports.getPost = async (req, res) => {
    try {
        const { id } = req.params;
        
        const post = await Post.findOne({
            _id: id,
            isDeleted: false
        })
        .populate('userId', 'username displayName avatar isVerified')
        .populate('originalPost')
        .populate({
            path: 'repost_of',
            populate: {
                path: 'userId',
                select: 'username displayName avatar isVerified'
            }
        });
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        // Check visibility
        if (post.visibility === 'private' && post.userId._id !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Tăng view count
        await post.incrementView();
        
        // Thêm thông tin user đã like hay chưa
        const postData = post.toObject();
        if (req.userId) {
            postData.isLiked = post.isLikedBy(req.userId);
        }
        
        // ✅ THÊM DÒNG NÀY: Đảm bảo commentCount được trả về
        // Nếu post không có commentCount, tính từ database
        if (postData.commentCount === undefined) {
            const Comment = require('../models/Comment');
            postData.commentCount = await Comment.countDocuments({
                postId: id,
                isDeleted: false
            });
        }
        
        res.json({
            success: true,
            data: postData // ✅ GIỜ ĐÃ CÓ commentCount
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Cập nhật post
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, images, video, visibility } = req.body;
        
        const post = await Post.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        // Check ownership
        if (post.userId !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Update fields
        if (content !== undefined) post.content = content.trim();
        if (images !== undefined) post.images = images;
        if (video !== undefined) post.video = video;
        if (visibility !== undefined) post.visibility = visibility;
        
        await post.save();
        await post.populate('userId', 'username displayName avatar isVerified');
        
        res.json({
            success: true,
            message: 'Post updated successfully',
            data: post
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Xóa post
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        
        const post = await Post.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        // Check ownership
        if (post.userId !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Hard delete - xóa images/video từ Cloudinary trước (optional, không fail nếu lỗi)
        try {
            if (post.images && post.images.length > 0) {
                const cloudinary = require('cloudinary').v2;
                for (const imageUrl of post.images) {
                    try {
                        // Extract public_id từ Cloudinary URL
                        // Format: https://res.cloudinary.com/cloud/image/upload/v123456/folder/filename.jpg
                        const urlParts = imageUrl.split('/');
                        const filename = urlParts[urlParts.length - 1];
                        const publicId = filename.split('.')[0];
                        await cloudinary.uploader.destroy(publicId);
                        console.log(`Deleted image from Cloudinary: ${publicId}`);
                    } catch (error) {
                        console.error('Error deleting image from Cloudinary:', error);
                    }
                }
            }
            
            if (post.video) {
                const cloudinary = require('cloudinary').v2;
                try {
                    // Extract public_id từ Cloudinary URL
                    const urlParts = post.video.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = filename.split('.')[0];
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                    console.log(`Deleted video from Cloudinary: ${publicId}`);
                } catch (error) {
                    console.error('Error deleting video from Cloudinary:', error);
                }
            }
        } catch (cloudinaryError) {
            console.error('Cloudinary deletion failed, continuing with database cleanup:', cloudinaryError);
        }
        
        // Nếu đây là repost, giảm repost count của original post
        if (post.repost_of) {
            try {
                await Post.findByIdAndUpdate(post.repost_of, { 
                    $inc: { repostCount: -1 } 
                });
                console.log(`Decreased repost count for original post: ${post.repost_of}`);
            } catch (error) {
                console.error('Error updating original post repost count:', error);
            }
        }
        
        // Nếu đây là original post, mark tất cả reposts để hiển thị "bài gốc đã bị gỡ"
        if (!post.repost_of) {
            try {
                // Tìm tất cả reposts của post này
                const reposts = await Post.find({ repost_of: id });
                console.log(`Found ${reposts.length} reposts of this original post`);
                
                // Mark reposts để hiển thị "original deleted" message
                // Không xóa reposts, chỉ mark để UI hiển thị message
                await Post.updateMany(
                    { repost_of: id },
                    { $set: { originalPostDeleted: true } }
                );
                console.log(`Marked ${reposts.length} reposts as having deleted original`);
            } catch (error) {
                console.error('Error handling reposts of deleted original post:', error);
            }
        }
        
        // Hard delete từ MongoDB
        await Post.findByIdAndDelete(id);
        
        // Xóa tất cả comments của post này
        await Comment.deleteMany({ postId: id });
        
        // Likes sẽ được xóa cùng với post (embedded trong Post model)
        
        // Xóa tất cả notifications liên quan đến post này
        await Notification.deleteMany({ 
            $or: [
                { 'metadata.postId': id },
                { entityId: id }
            ]
        });
        
        // Cập nhật post count của user
        await User.findByIdAndUpdate(req.userId, { $inc: { postCount: -1 } });
        
        // Emit real-time event for post deletion
        if (global.socketServer) {
            const deleteData = {
                postId: id,
                userId: req.userId,
                timestamp: new Date().toISOString()
            };
            
            // Broadcast to post room, global feed, and user's followers
            global.socketServer.emitToPost(id, 'post:deleted', deleteData);
            global.socketServer.io.to('feed:global').emit('post:deleted', deleteData);
            global.socketServer.io.to(`user:${req.userId}:posts`).emit('post:deleted', deleteData);
            
            }
        
        res.json({
            success: true,
            message: 'Post deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Archive post - soft delete với TTL 30 ngày
exports.archivePost = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('Archive request - postId:', id, 'userId:', req.userId);
        
        // Tìm post không quan tâm đến isDeleted/isArchived để debug
        const anyPost = await Post.findById(id);
        console.log('Any post found:', anyPost ? {
            _id: anyPost._id,
            userId: anyPost.userId,
            isDeleted: anyPost.isDeleted,
            isArchived: anyPost.isArchived
        } : 'null');
        
        // Đơn giản hóa query để test
        const post = await Post.findOne({
            _id: id
        });
        
        console.log('Simple query result:', post ? {
            _id: post._id,
            userId: post.userId,
            isDeleted: post.isDeleted,
            isArchived: post.isArchived
        } : 'null');
        
        // Check conditions manually
        if (post && post.isDeleted === true) {
            return res.status(404).json({
                success: false,
                message: 'Post is deleted'
            });
        }
        
        if (post && post.isArchived === true) {
            return res.status(400).json({
                success: false,
                message: 'Post is already archived'
            });
        }
        
        console.log('Found post:', post ? {
            _id: post._id,
            userId: post.userId,
            isDeleted: post.isDeleted,
            isArchived: post.isArchived
        } : 'null');
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found or already archived'
            });
        }
        
        // Check ownership với debug
        console.log('Ownership check - post.userId:', post.userId, 'req.userId:', req.userId, 'match:', post.userId === req.userId);
        
        if (post.userId !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Archive post với TTL 30 ngày
        console.log('About to archive post...');
        await post.archivePost();
        console.log('Post archived successfully, new state:', {
            isArchived: post.isArchived,
            archivedAt: post.archivedAt,
            expiresAt: post.expiresAt
        });
        
        // Emit real-time event for post archival
        if (global.socketServer) {
            const archiveData = {
                postId: id,
                userId: req.userId,
                timestamp: new Date().toISOString()
            };
            
            // Broadcast to post room, global feed, and user's followers
            global.socketServer.emitToPost(id, 'post:archived', archiveData);
            global.socketServer.io.to('feed:global').emit('post:archived', archiveData);
            global.socketServer.io.to(`user:${req.userId}:posts`).emit('post:archived', archiveData);
        }
        
        console.log('Sending success response...');
        res.json({
            success: true,
            message: 'Post archived successfully',
            data: {
                archivedAt: post.archivedAt,
                expiresAt: post.expiresAt
            }
        });
        console.log('Response sent successfully');
        
    } catch (error) {
        console.error('Error archiving post:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Lấy archived posts của user
exports.getArchivedPosts = async (req, res) => {
    try {
        console.log('🔍 getArchivedPosts called with userId:', req.userId);
        
        const { page = 1, limit = 10 } = req.query;
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        const query = { 
            userId: userId,
            isDeleted: false,
            isArchived: true
        };
        
        console.log('📋 Query:', query);
        
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
            .sort({ archivedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
        
        console.log('📝 Found posts:', posts.length);
        
        // Transform data to match frontend expectations
        const transformedPosts = posts.map(post => ({
            ...post,
            likesCount: post.likeCount || 0,
            commentsCount: post.commentCount || 0,
            isLiked: post.likes ? post.likes.some(like => like.userId === req.userId) : false
        }));
        
        const total = await Post.countDocuments(query);
        const currentPage = parseInt(page);
        const totalPages = Math.ceil(total / limit);
        
        console.log('📊 Pagination:', { total, currentPage, totalPages });
        
        res.json({
            success: true,
            data: transformedPosts,
            pagination: {
                page: currentPage,
                limit: parseInt(limit),
                total,
                pages: totalPages,
                hasMore: currentPage < totalPages,
                hasNext: currentPage < totalPages,
                hasPrev: currentPage > 1
            }
        });
        
    } catch (error) {
        console.error('Error getting archived posts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Restore archived post
exports.restorePost = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('Restore request - postId:', id, 'userId:', req.userId);
        
        const post = await Post.findOne({
            _id: id,
            isDeleted: false,
            isArchived: true
        });
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Archived post not found'
            });
        }
        
        // Check ownership
        if (post.userId !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Restore post
        console.log('About to restore post...');
        await post.restorePost();
        console.log('Post restored successfully');
        
        // Emit real-time event for post restoration
        if (global.socketServer) {
            const restoreData = {
                postId: id,
                userId: req.userId,
                timestamp: new Date().toISOString()
            };
            
            // Broadcast to post room, global feed, and user's followers
            global.socketServer.emitToPost(id, 'post:restored', restoreData);
            global.socketServer.io.to('feed:global').emit('post:restored', restoreData);
            global.socketServer.io.to(`user:${req.userId}:posts`).emit('post:restored', restoreData);
        }
        
        res.json({
            success: true,
            message: 'Post restored successfully'
        });
        
    } catch (error) {
        console.error('Error restoring post:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Lấy posts của một user
exports.getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        // Kiểm tra user có tồn tại không
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        let query = { 
            userId: userId,
            isDeleted: false,
            $or: [
                { isArchived: false },
                { isArchived: { $exists: false } }
            ]
        };
        
        // Nếu không phải chính user đó, chỉ hiển thị public posts
        if (req.userId !== userId) {
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
        
        // Thêm thông tin user đã like hay chưa
        if (req.userId) {
            posts.forEach(post => {
                post.isLiked = post.likes.some(like => like.userId === req.userId);
            });
        }
        
        const total = await Post.countDocuments(query);
        
        res.json({
            success: true,
            data: posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Lấy danh sách users đã like post
exports.getPostLikes = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 50 } = req.query;
        
        const post = await Post.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        // Lấy danh sách user IDs từ likes
        const likeUserIds = post.likes.map(like => like.userId);
        
        if (likeUserIds.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: 'No likes yet'
            });
        }
        
        // Lấy thông tin users với pagination
        const users = await User.find({
            _id: { $in: likeUserIds }
        })
        .select('username displayName avatar isVerified followerCount followingCount postCount createdAt')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
        
        // Thêm thông tin thời gian like và follow status
        const usersWithLikeInfo = users.map(user => {
            const likeInfo = post.likes.find(like => like.userId.toString() === user._id.toString());
            
            return {
                ...user,
                likedAt: likeInfo?.createdAt || new Date(),
                isFollowing: req.userId ? user.followers?.includes(req.userId) : false
            };
        });
        
        res.json({
            success: true,
            data: usersWithLikeInfo,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: likeUserIds.length,
                pages: Math.ceil(likeUserIds.length / limit)
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Lấy posts trending
exports.getTrendingPosts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const posts = await Post.getTrendingPosts(limit);
        
        // Thêm thông tin user đã like hay chưa
        const postsWithLikeInfo = posts.map(post => {
            const postData = post.toObject();
            if (req.userId) {
                postData.isLiked = post.isLikedBy(req.userId);
            }
            return postData;
        });
        
        res.json({
            success: true,
            data: postsWithLikeInfo
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Share một post
exports.sharePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { shareText } = req.body;
        
        // Kiểm tra post gốc có tồn tại không
        const originalPost = await Post.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!originalPost) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        // Không cho phép share post private
        if (originalPost.visibility === 'private') {
            return res.status(403).json({
                success: false,
                message: 'Cannot share private post'
            });
        }
        
        // Tạo shared post
        const sharedPost = new Post({
            userId: req.userId,
            content: shareText || '',
            originalPost: id,
            shareText: shareText || '',
            visibility: 'public'
        });
        
        await sharedPost.save();
        await sharedPost.populate('userId', 'username displayName avatar isVerified');
        await sharedPost.populate('originalPost');
        
        // Cập nhật share count của post gốc
        originalPost.shareCount += 1;
        await originalPost.save();
        
        // Cập nhật post count của user
        await User.findByIdAndUpdate(req.userId, { $inc: { postCount: 1 } });
        
        res.status(201).json({
            success: true,
            message: 'Post shared successfully',
            data: sharedPost
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Tìm kiếm posts
exports.searchPosts = async (req, res) => {
    try {
        const { q, hashtag, page = 1, limit = 10 } = req.query;
        
        let query = { 
            isDeleted: false,
            $or: [
                { isArchived: false },
                { isArchived: { $exists: false } }
            ],
            visibility: 'public'
        };
        
        if (hashtag) {
            // Tìm kiếm theo hashtag
            query.hashtags = hashtag.toLowerCase().replace('#', '');
        } else if (q) {
            // Tìm kiếm trong content
            query.content = new RegExp(q, 'i');
        } else {
            return res.status(400).json({
                success: false,
                message: 'Search query or hashtag is required'
            });
        }
        
        const posts = await Post.find(query)
            .populate('userId', 'username displayName avatar isVerified')
            .populate('originalPost')
            .sort({ engagementScore: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
        
        // Thêm thông tin user đã like hay chưa
        if (req.userId) {
            posts.forEach(post => {
                post.isLiked = post.likes.some(like => like.userId === req.userId);
            });
        }
        
        const total = await Post.countDocuments(query);
        const currentPage = parseInt(page);
        const totalPages = Math.ceil(total / limit);
        
        res.json({
            success: true,
            data: posts,
            pagination: {
                page: currentPage,
                limit: parseInt(limit),
                total,
                pages: totalPages,
                hasNext: currentPage < totalPages, // ⚡ THÊM hasNext
                hasPrev: currentPage > 1
            },
            searchQuery: q || hashtag
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
        });
    }
};

// API để lấy link preview cho URL
exports.getLinkPreview = async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL is required'
            });
        }

        const preview = await linkPreviewService.getPreview(url);
        
        res.json({
            success: true,
            data: preview
        });
        
    } catch (error) {
        console.error('Link preview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch link preview',
            error: error.message
        });
    }
};

// API để lấy multiple link previews từ text content
exports.getMultipleLinkPreviews = async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }

        const urls = linkPreviewService.extractUrls(content);
        
        if (urls.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const previews = await linkPreviewService.getMultiplePreviews(urls);
        
        res.json({
            success: true,
            data: previews
        });
        
    } catch (error) {
        console.error('Multiple link preview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch link previews',
            error: error.message
        });
    }
};

// Repost một post
exports.repostPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body; // Optional comment khi repost
        
        // Kiểm tra post gốc có tồn tại không
        const originalPost = await Post.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!originalPost) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        // Không cho phép repost post private
        if (originalPost.visibility === 'private') {
            return res.status(403).json({
                success: false,
                message: 'Cannot repost private post'
            });
        }
        
        // Không cho phép repost chính post của mình
        if (originalPost.userId === req.userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot repost your own post'
            });
        }
        
        // Kiểm tra đã repost chưa
        const existingRepost = await Post.findOne({
            userId: req.userId,
            repost_of: id,
            isDeleted: false
        });
        
        if (existingRepost) {
            return res.status(400).json({
                success: false,
                message: 'You have already reposted this post'
            });
        }
        
        // Tạo repost
        const repost = new Post({
            userId: req.userId,
            content: content || '', // Optional comment
            repost_of: id,
            visibility: 'public'
        });
        
        await repost.save();
        await repost.populate('userId', 'username displayName avatar isVerified');
        await repost.populate({
            path: 'repost_of',
            populate: {
                path: 'userId',
                select: 'username displayName avatar isVerified'
            }
        });
        
        // Cập nhật repost count của post gốc
        originalPost.repostCount += 1;
        await originalPost.save();
        
        // Cập nhật post count của user
        await User.findByIdAndUpdate(req.userId, { $inc: { postCount: 1 } });
        
        // Tạo notification cho tác giả post gốc
        const NotificationHelper = require('../utils/notificationHelper');
        const notificationHelper = new NotificationHelper();
        await notificationHelper.handleRepost(id, originalPost.userId, req.userId);
        
        // Emit real-time event
        if (global.socketServer) {
            const repostData = {
                repost: repost.toObject(),
                originalPostId: id,
                userId: req.userId,
                timestamp: new Date().toISOString()
            };
            
            // Broadcast to global feed
            global.socketServer.io.to('feed:global').emit('post:reposted', repostData);
            
            // Broadcast to user's followers
            global.socketServer.io.to(`user:${req.userId}:posts`).emit('post:reposted', repostData);
        }
        
        res.status(201).json({
            success: true,
            message: 'Post reposted successfully',
            data: repost
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Export setSocketServer function
exports.setSocketServer = setSocketServer;