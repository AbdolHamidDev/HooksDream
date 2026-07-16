// services/index.ts - Barrel export for all API services
// This provides a single import point for all API services

// Core API utilities
export { 
  apiCall, 
  apiFormDataCall, 
  getAuthHeaders, 
  getAuthHeadersForFormData, 
  debouncedLogin, 
  resizeImage,
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  RATE_LIMIT_CONFIG
} from './api';

// Domain-specific API services
export { userApi } from './userApi';
export { postApi } from './postApi';
export { commentApi } from './commentApi';
export { chatApi } from './chatApi';

// Legacy API object (for backward compatibility)
export { api as default, searchApi } from './api';
