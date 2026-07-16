// services/commentApi.ts - Comment API endpoints
import { apiCall, apiFormDataCall, IMAGE_MIME_TYPES } from './api';

export const commentApi = {
  // Get comments for a post
  getComments: async (postId: string, params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    const response = await apiCall(`/api/posts/${postId}/comments?${searchParams.toString()}`);
    
    if (response.success && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((comment: any) => ({
          ...comment,
          replies: comment.replies || []
        }))
      };
    }
    
    return response;
  },

  // Create comment
  createComment: async (postId: string, commentData: { 
    content: string; 
    image?: string; 
  }) => {
    try {
      const response = await apiCall(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(commentData),
      });

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create reply
  createReply: async (postId: string, parentCommentId: string, replyData: { 
    content: string; 
    image?: string; 
  }) => {
    try {
      const response = await apiCall(`/api/posts/${postId}/comments/${parentCommentId}/replies`, {
        method: 'POST',
        body: JSON.stringify(replyData),
      });

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Like comment
  likeComment: async (postId: string, commentId: string) => {
    return apiCall(`/api/posts/${postId}/comments/${commentId}/like`, {
      method: 'POST',
    });
  },

  // Unlike comment
  unlikeComment: async (postId: string, commentId: string) => {
    return apiCall(`/api/posts/${postId}/comments/${commentId}/like`, {
      method: 'POST',
    });
  },

  // Delete comment
  deleteComment: async (postId: string, commentId: string) => {
    return apiCall(`/api/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  // Update comment
  updateComment: async (postId: string, commentId: string, updateData: {
    content: string;
    image?: string;
  }) => {
    return apiCall(`/api/posts/${postId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Get replies
  getReplies: async (commentId: string, params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    return apiCall(`/api/comments/${commentId}/replies?${searchParams.toString()}`);
  },

  // Upload comment image
  uploadCommentImage: async (file: File): Promise<string> => {
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a valid image file.');
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await apiFormDataCall('/api/comments/upload-image', formData);
      
      if (response.success && response.data?.url) {
        return response.data.url;
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};