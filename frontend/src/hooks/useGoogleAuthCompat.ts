// useGoogleAuthCompat.ts - Backward Compatibility Layer
// This file re-exports useAuth to maintain compatibility with existing code
// DEPRECATED: Use useAuth from './useAuth' instead

export { useAuth as useGoogleAuth } from './useAuth';
export { useAuth as useModernGoogleAuth } from './useAuth';
export { useAuth as useGoogleAuthFallback } from './useAuth';

// Re-export only what's needed
export type { AuthState } from './useAuth';
