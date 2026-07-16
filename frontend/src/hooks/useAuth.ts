// useAuth.ts - Unified Authentication Hook
// Consolidates useGoogleAuth, useGoogleAuthFallback, and useModernGoogleAuth
// Single source of truth for authentication state and operations

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { SessionManager } from '@/utils/sessionManager';

// Auth states
export const AuthState = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  AUTHENTICATING: 'authenticating',
  LOADING_PROFILE: 'loading_profile',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type AuthState = typeof AuthState[keyof typeof AuthState];

// Error types
export const AuthErrorType = {
  SCRIPT_LOAD_FAILED: 'script_load_failed',
  GOOGLE_INIT_FAILED: 'google_init_failed',
  AUTHENTICATION_FAILED: 'authentication_failed',
  NETWORK_ERROR: 'network_error',
  TOKEN_INVALID: 'token_invalid',
  USER_CANCELLED: 'user_cancelled'
} as const;

export type AuthErrorType = typeof AuthErrorType[keyof typeof AuthErrorType];

export interface AuthError {
  type: AuthErrorType;
  message: string;
  canRetry: boolean;
}

// Main context interface
export interface AuthContext {
  // State
  isLoading: boolean;
  isConnected: boolean;
  isInitialized: boolean;
  error: AuthError | null;
  authState: AuthState;
  
  // Data
  token: string | null;
  profile: any;
  user: any;
  
  // Actions
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  clearError: () => void;
  handleCredentialResponse: (response: any) => Promise<void>;
  retry: () => Promise<void>;
  
  // Utils
  getAuthHeaders: () => Record<string, string>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const useAuth = (): AuthContext => {
  // Core state
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [authState, setAuthState] = useState<AuthState>(AuthState.IDLE);
  const [token, setToken] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs
  const initializationRef = useRef<boolean>(false);
  const googleScriptLoaded = useRef<boolean>(false);
  
  // App store
  const { 
    setIsConnected, 
    setProfile, 
    setUser,
    isConnected,
    profile,
    user
  } = useAppStore();

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setAuthState(AuthState.IDLE);
  }, []);

  // Create error object
  const createError = useCallback((type: AuthErrorType, message: string, canRetry = true): AuthError => ({
    type,
    message,
    canRetry
  }), []);

  // Update auth state
  const updateAuthState = useCallback((newState: AuthState) => {
    setAuthState(newState);
    if (newState !== AuthState.ERROR) {
      setError(null);
    }
  }, []);

  // Load Google Script (only once)
  const loadGoogleScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Already loaded
      if (googleScriptLoaded.current && window.google?.accounts?.id) {
        resolve();
        return;
      }

      // Check if script exists
      const existingScript = document.getElementById('google-auth-script');
      if (existingScript) {
        const checkGoogle = setInterval(() => {
          if (window.google?.accounts?.id) {
            googleScriptLoaded.current = true;
            clearInterval(checkGoogle);
            resolve();
          }
        }, 100);
        
        // Timeout after 10s
        setTimeout(() => {
          clearInterval(checkGoogle);
          if (!window.google?.accounts?.id) {
            reject(new Error('Google script loading timeout'));
          }
        }, 10000);
        return;
      }

      // Create script
      const script = document.createElement('script');
      script.id = 'google-auth-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        const checkGoogle = setInterval(() => {
          if (window.google?.accounts?.id) {
            googleScriptLoaded.current = true;
            clearInterval(checkGoogle);
            resolve();
          }
        }, 50);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Authentication script'));
      };
      
      document.head.appendChild(script);
      
      // Timeout after 10s
      setTimeout(() => {
        if (!window.google?.accounts?.id) {
          reject(new Error('Google script loading timeout'));
        }
      }, 10000);
    });
  }, []);

  // Initialize Google Auth
  const initializeGoogleAuth = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      updateAuthState(AuthState.INITIALIZING);
      
      // Load Google script
      await loadGoogleScript();
      
      // Initialize Google Identity Services
      if (!window.google?.accounts?.id) {
        throw new Error('Google Identity Services not available');
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Check for existing session
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        setToken(savedToken);
        await validateAndLoadUser(savedToken);
      } else {
        updateAuthState(AuthState.IDLE);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Google Auth initialization failed:', error);
      setError(createError(
        AuthErrorType.GOOGLE_INIT_FAILED,
        'Failed to initialize Google Authentication',
        true
      ));
      updateAuthState(AuthState.ERROR);
      setIsInitialized(true);
    }
  }, [loadGoogleScript, updateAuthState, createError]);

  // Validate token and load user
  const validateAndLoadUser = useCallback(async (authToken: string) => {
    try {
      updateAuthState(AuthState.LOADING_PROFILE);

      const response = await fetch(`${API_BASE_URL}/api/users/profile/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Token validation failed (${response.status})`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid user data received');
      }

      // Update app state
      setUser(data.data);
      setProfile(data.data);
      setIsConnected(true);
      
      updateAuthState(AuthState.SUCCESS);

    } catch (error) {
      console.error('Token validation failed:', error);
      
      // Clear invalid token
      setToken(null);
      localStorage.removeItem('auth_token');
      setIsConnected(false);
      setUser(null);
      setProfile(null);
      
      updateAuthState(AuthState.IDLE);
    }
  }, [updateAuthState, setUser, setProfile, setIsConnected]);

  // Handle Google credential response
  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      updateAuthState(AuthState.AUTHENTICATING);
      setIsLoading(true);

      // Send credential to backend
      const backendResponse = await fetch(`${API_BASE_URL}/api/auth/google/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: response.credential
        }),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Authentication failed (${backendResponse.status})`);
      }

      const data = await backendResponse.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Invalid response from server');
      }

      updateAuthState(AuthState.LOADING_PROFILE);

      // Extract data
      const { user: userData, token: jwtToken, profile: profileData } = data.data;
      
      if (!userData || !jwtToken) {
        throw new Error('Incomplete authentication data received');
      }

      // Save token
      setToken(jwtToken);
      localStorage.setItem('auth_token', jwtToken);
      
      // Save session for 30-day persistence
      SessionManager.saveAuthSession(jwtToken, userData, profileData || userData);
      
      // Update app state
      setUser(userData);
      setProfile(profileData || userData);
      setIsConnected(true);
      
      updateAuthState(AuthState.SUCCESS);

    } catch (error) {
      console.error('Authentication failed:', error);
      
      // Clear any partial state
      setToken(null);
      localStorage.removeItem('auth_token');
      setIsConnected(false);
      setUser(null);
      setProfile(null);
      
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(createError(
        AuthErrorType.AUTHENTICATION_FAILED,
        errorMessage,
        true
      ));
      updateAuthState(AuthState.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [updateAuthState, createError, setUser, setProfile, setIsConnected]);

  // Login function
  const login = useCallback(async () => {
    try {
      setError(null);
      updateAuthState(AuthState.AUTHENTICATING);
      setIsLoading(true);

      if (!window.google?.accounts?.id) {
        throw new Error('Google Authentication not initialized');
      }

      // Use standard button approach
      const buttonElement = document.getElementById('google-signin-button');
      if (buttonElement) {
        window.google.accounts.id.renderButton(
          buttonElement,
          {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'signin_with',
            logo_alignment: 'left',
            width: buttonElement.offsetWidth || 320
          }
        );
      }

    } catch (error) {
      console.error('Login failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(createError(
        AuthErrorType.AUTHENTICATION_FAILED,
        errorMessage,
        true
      ));
      updateAuthState(AuthState.ERROR);
      setIsLoading(false);
    }
  }, [updateAuthState, createError]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Clear session
      SessionManager.clearAuthSession();
      
      // Clear local state
      setToken(null);
      setIsConnected(false);
      setUser(null);
      setProfile(null);
      
      // Sign out from Google
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

      // Optional: Call backend logout
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          // Ignore backend logout errors
        }
      }

      updateAuthState(AuthState.IDLE);

    } catch (error) {
      console.error('Logout failed:', error);
      updateAuthState(AuthState.IDLE);
    } finally {
      setIsLoading(false);
    }
  }, [token, updateAuthState, setIsConnected, setUser, setProfile]);

  // Retry function with exponential backoff
  const retry = useCallback(async () => {
    if (retryCount >= 3) {
      setError(createError(
        AuthErrorType.AUTHENTICATION_FAILED,
        'Maximum retry attempts reached. Please refresh the page.',
        false
      ));
      return;
    }

    setRetryCount(prev => prev + 1);
    
    // Exponential backoff
    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Reset state and try again
    setError(null);
    updateAuthState(AuthState.IDLE);
    
    // Try to login again
    await login();
  }, [retryCount, login, createError, updateAuthState]);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      await validateAndLoadUser(token);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, validateAndLoadUser]);

  // Get auth headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Content-Type': 'application/json',
    };
  }, [token]);

  // Initialize on mount
  useEffect(() => {
    if (!initializationRef.current) {
      initializeGoogleAuth();
    }
  }, [initializeGoogleAuth]);

  return {
    // State
    isLoading,
    isConnected,
    isInitialized,
    error,
    authState,
    
    // Data
    token,
    profile,
    user,
    
    // Actions
    login,
    logout,
    refreshUserData,
    clearError,
    handleCredentialResponse,
    retry,
    
    // Utils
    getAuthHeaders,
  };
};

// Global editing state management (for backward compatibility)
let globalEditingState = false;
export const setGlobalEditingState = (editing: boolean) => {
  globalEditingState = editing;
};

// Backward compatibility exports (deprecated - use useAuth instead)
export { useAuth as useGoogleAuth };
export { useAuth as useModernGoogleAuth };

// Global types for Google
declare global {
  interface Window {
    google: any;
  }
}