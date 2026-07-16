// validators/postValidator.js - Zod validation schemas
const { z } = require('zod');

// Create Post Schema
const createPostSchema = z.object({
  content: z.string().max(5000).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  video: z.string().url().optional(),
  visibility: z.enum(['public', 'private']).default('public')
});

// Update Post Schema
const updatePostSchema = z.object({
  content: z.string().max(5000).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  video: z.string().url().optional(),
  visibility: z.enum(['public', 'private']).optional()
});

// Get Posts Query Schema
const getPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sort: z.enum(['latest', 'trending', 'popular']).default('latest')
});

// Get User Posts Query Schema
const getUserPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10)
});

// Search Posts Query Schema
const searchPostsQuerySchema = z.object({
  q: z.string().max(200).optional(),
  hashtag: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sort: z.enum(['relevance', 'latest', 'popular']).default('relevance')
});

// Validation helper function
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse({
        ...req.body,
        ...req.query,
        ...req.params
      });
      
      // Replace req data with validated data
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

module.exports = {
  createPostSchema,
  updatePostSchema,
  getPostsQuerySchema,
  getUserPostsQuerySchema,
  searchPostsQuerySchema,
  validateRequest
};
