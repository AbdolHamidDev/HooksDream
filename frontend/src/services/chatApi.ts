// services/chatApi.ts - Chat API endpoints
import { apiCall } from './api';

export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
  }>;
  lastMessage?: {
    content: string;
    sender: string;
    createdAt: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  content: {
    text?: string;
    image?: string;
    replyTo?: string;
  };
  type: 'text' | 'image';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  readBy: string[];
  reactions: Array<{
    emoji: string;
    users: string[];
  }>;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const chatApi = {
  // Get all conversations
  getConversations: async (params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    return apiCall(`/api/chat/conversations?${searchParams.toString()}`);
  },

  // Get or create direct conversation
  getOrCreateDirectConversation: async (userId: string) => {
    return apiCall(`/api/chat/conversations/direct/${userId}`);
  },

  // Get conversation by ID
  getConversation: async (conversationId: string) => {
    return apiCall(`/api/chat/conversations/${conversationId}`);
  },

  // Get messages in conversation
  getMessages: async (conversationId: string, params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    return apiCall(`/api/chat/conversations/${conversationId}/messages?${searchParams.toString()}`);
  },

  // Send message
  sendMessage: async (conversationId: string, messageData: { 
    text?: string; 
    image?: string; 
    replyTo?: string; 
  }) => {
    return apiCall(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  // Mark messages as read
  markAsRead: async (conversationId: string, messageIds: string[]) => {
    return apiCall(`/api/chat/conversations/${conversationId}/read`, {
      method: 'POST',
      body: JSON.stringify({ messageIds }),
    });
  },

  // Delete message
  deleteMessage: async (messageId: string) => {
    return apiCall(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  // Add reaction
  addReaction: async (messageId: string, emoji: string) => {
    return apiCall(`/api/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },

  // Remove reaction
  removeReaction: async (messageId: string, emoji: string) => {
    return apiCall(`/api/chat/messages/${messageId}/reactions`, {
      method: 'DELETE',
      body: JSON.stringify({ emoji }),
    });
  },

  // Upload image
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await apiCall('/api/chat/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (response.success && response.data?.url) {
        return response.data.url;
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Delete conversation
  deleteConversation: async (conversationId: string) => {
    return apiCall(`/api/chat/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  },
};