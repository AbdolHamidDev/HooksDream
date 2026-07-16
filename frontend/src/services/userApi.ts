// services/userApi.ts - User API endpoints
import { apiCall, debouncedLogin } from './api';

export const userApi = {
  // Login with debouncing
  login: async (userData: { hashId: string; email: string; name: string; avatar?: string }) => {
    return debouncedLogin(() => apiCall('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(userData),
    }));
  },

  // Get popular users
  getPopularUsers: async () => {
    return apiCall('/api/users/popular');
  },

  // Enhanced Friend Discovery APIs
  getRecommendedUsers: async (limit = 10) => {
    return apiCall(`/api/discovery/recommended?limit=${limit}`);
  },

  getNearbyUsers: async (radius = 50, lat?: number, lng?: number, limit = 15) => {
    const params = new URLSearchParams({
      radius: radius.toString(),
      limit: limit.toString()
    });
    
    if (lat && lng) {
      params.append('lat', lat.toString());
      params.append('lng', lng.toString());
    }
    
    return apiCall(`/api/discovery/nearby?${params.toString()}`);
  },

  getNewUsers: async (limit = 20, days = 30) => {
    return apiCall(`/api/discovery/new?limit=${limit}&days=${days}`);
  },

  getTrendingUsers: async (limit = 15, days = 7) => {
    return apiCall(`/api/discovery/trending?limit=${limit}&days=${days}`);
  },
  
  // Get user profile
  getProfile: async (hashId: string) => {
    try {
      const response = await apiCall(`/api/users/profile/${hashId}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          message: response.message || 'Success',
          data: {
            _id: response.data._id,
            username: response.data.username,
            displayName: response.data.displayName,
            bio: response.data.bio || '',
            location: response.data.location,
            website: response.data.website,
            avatar: response.data.avatar,
            coverImage: response.data.coverImage,
            email: response.data.email,
            phone: response.data.phone,
            pronouns: response.data.pronouns,
            followerCount: response.data.followerCount || 0,
            followingCount: response.data.followingCount || 0,
            postCount: response.data.postCount || 0,
            isFollowing: response.data.isFollowing,
            isOwnProfile: response.data.isOwnProfile,
            isSetupComplete: response.data.isSetupComplete !== false,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
            lastLoginAt: response.data.lastLoginAt
          },
          statusCode: response.statusCode
        };
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (hashId: string, updateData: {
    username?: string; 
    displayName?: string; 
    bio?: string; 
    location?: string;
    website?: string;
    phone?: string;
    pronouns?: string;
    avatarBase64?: string;
    coverImageBase64?: string;
    avatarFile?: File;
    coverImageFile?: File;
  }) => {
    const hasFiles = updateData.avatarFile || updateData.coverImageFile;

    if (hasFiles) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Add text fields (use !== undefined to allow empty strings)
      if (updateData.username) formData.append('username', updateData.username);
      if (updateData.displayName) formData.append('displayName', updateData.displayName);
      if (updateData.bio !== undefined) formData.append('bio', updateData.bio);
      if (updateData.location !== undefined) formData.append('location', updateData.location);
      if (updateData.website !== undefined) formData.append('website', updateData.website);
      if (updateData.phone !== undefined) formData.append('phone', updateData.phone);
      if (updateData.pronouns !== undefined) formData.append('pronouns', updateData.pronouns);
      
      // Add files
      if (updateData.avatarFile) {
        formData.append('avatar', updateData.avatarFile);
      }
      if (updateData.coverImageFile) {
        formData.append('coverImage', updateData.coverImageFile);
      }

      const { apiFormDataCall } = await import('./api');
      return apiFormDataCall(`/api/users/profile/${hashId}`, formData, 'PUT');
    } else {
      // Use JSON for text-only updates
      return apiCall(`/api/users/profile/${hashId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    }
  },

  // Upload avatar
  uploadAvatar: async (hashId: string, file: File): Promise<any> => {
    const { IMAGE_MIME_TYPES, resizeImage } = await import('./api');
    
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a valid image file.');
    }

    try {
      const resizedFile = await resizeImage(file, 400, 400, 0.9);
      return await userApi.updateProfile(hashId, { 
        avatarFile: resizedFile 
      });
    } catch (error) {
      throw new Error(`Avatar upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Upload cover image
  uploadCoverImage: async (hashId: string, file: File): Promise<any> => {
    const { IMAGE_MIME_TYPES, resizeImage } = await import('./api');
    
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a valid image file.');
    }

    try {
      const resizedFile = await resizeImage(file, 1200, 400, 0.85);
      return await userApi.updateProfile(hashId, { 
        coverImageFile: resizedFile 
      });
    } catch (error) {
      throw new Error(`Cover upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  // Search users
  searchUsers: async (params: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    
    return apiCall(`/api/users?${searchParams.toString()}`);
  },

  // Get user stats
  getUserStats: async (userId: string) => {
    return apiCall(`/api/users/${userId}/stats`);
  },
};