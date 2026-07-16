const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// Import controllers
const uploadController = require('../controllers/uploadController');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const { getCommentCount, getCommentStats } = require('../controllers/commentController');
const likeController = require('../controllers/likeController');

// Upload routes
router.post('/upload-images', authMiddleware, uploadController.uploadImages);
router.post('/upload-image', authMiddleware, uploadController.uploadImage);
router.post('/upload-video', authMiddleware, uploadController.uploadVideo);

// Post routes - SPECIFIC ROUTES FIRST, THEN DYNAMIC ROUTES
router.get('/', optionalAuth, postController.getPosts);
router.get('/archived', authMiddleware, postController.getArchivedPosts);
router.get('/trending', optionalAuth, postController.getTrendingPosts);
router.get('/search', optionalAuth, postController.searchPosts);
router.get('/user/:userId', optionalAuth, postController.getUserPosts);

router.post('/', authMiddleware, async (req, res, next) => {
    try {
        await postController.createPost(req, res);
    } catch (error) {
        next(error);
    }
});

// Comment routes - specific before dynamic
router.get('/:id/comments/count', optionalAuth, getCommentCount);
router.get('/:id/comments', optionalAuth, commentController.getComments);
router.post('/:id/comments', authMiddleware, commentController.createComment);

// Like/Unlike routes
router.post('/:id/like', authMiddleware, likeController.toggleLike);

// Post CRUD routes
router.get('/:id', optionalAuth, postController.getPost);
router.put('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);
router.patch('/:id/archive', authMiddleware, postController.archivePost);
router.patch('/:id/restore', authMiddleware, postController.restorePost);
router.post('/:id/share', authMiddleware, postController.sharePost);
router.post('/:id/repost', authMiddleware, postController.repostPost);
router.get('/:id/likes', optionalAuth, postController.getPostLikes);

// Link preview routes
router.post('/preview-link', authMiddleware, postController.getLinkPreview);
router.post('/preview-links', authMiddleware, postController.getMultipleLinkPreviews);

// Comment stats
router.get('/comments/stats', authMiddleware, getCommentStats);

module.exports = router;