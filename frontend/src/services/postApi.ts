// services/postApi.ts - Post API endpoints
import { apiCall, apiFormDataCall, IMAGE_MIME_TYPES, VIDEO_MIME_TYPES } from './api';

export const postApi = {
  // Get posts feed
  getPosts: async (params: { page?: number; limit?: number; sort?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    
    return apiCall(`/api/posts?${searchParams.toString()}`);
  },
  
  // Create post
  createPost: async (postData: { content: string; images?: string[]; video?: string; visibility?: string; userId?: string }) => {
    return apiCall('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  // Upload image
  uploadImage: async (file: File): Promise<string> => {
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a valid image file.');
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await apiFormDataCall('/api/posts/upload-image', formData);
      
      if (response.success && response.data?.url) {
        return response.data.url;
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Upload video
  uploadVideo: async (file: File): Promise<string> => {
    if (!VIDEO_MIME_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a valid video file.');
    }

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await apiFormDataCall('/api/posts/upload-video', formData);
      
      if (response.success && response.data?.url) {
        return response.data.url;
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      throw new Error(`Video upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Like post
  likePost: async (postId: string) => {
    return apiCall(`/api/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  // Unlike post
  unlikePost: async (postId: string) => {
    return apiCall(`/api/posts/${postId}/unlike`, {
      method: 'POST',
    });
  },

  // Delete post
  deletePost: async (postId: string) => {
    return apiCall(`/api/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  // Archive post
  archivePost: async (postId: string) => {
    return apiCall(`/api/posts/${postId}/archive`, {
      method: 'PATCH',
    });
  },

  // Restore post
  restorePost: async (postId: string) => {
    return apiCall(`/api/posts/${postId}/restore`, {
      method: 'PATCH',
    });
  },

  // Get archived posts
  getArchivedPosts: async (params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    return apiCall(`/api/posts/archived?${searchParams.toString()}`);
  },

  // Get single post
  getPost: async (postId: string) => {
    return apiCall(`/api/posts/${postId}`);
  },

  // Get user posts
  getUserPosts: async (userId: string, params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    return apiCall(`/api/posts/user/${userId}?${searchParams.toString()}`);
  },

  // Repost
  repostPost: async (postId: string, content?: string) => {
    return apiCall(`/api/posts/${postId}/repost`, {
      method: 'POST',
      body: JSON.stringify({ content: content || '' }),
    });
  },

  // Get trending posts
  getTrendingPosts: async (limit = 10) => {
    return apiCall(`/api/posts/trending?limit=${limit}`);
  },

  // Share post
  sharePost: async (postId: string, shareText?: string) => {
    return apiCall(`/api/posts/${postId}/share`, {
      method: 'POST',
      body: JSON.stringify({ shareText: shareText || '' }),
    });
  },
};