// useGoogleAuth.ts - DEPRECATED
// This file is deprecated. Use useAuth from './useAuth' instead
// Kept for backward compatibility during migration

// Re-export everything from the new unified hook
export { useAuth as useGoogleAuth, setGlobalEditingState, AuthState, AuthErrorType } from './useAuth';

// Also re-export as default for compatibility
export { useAuth as default } from './useAuth';
