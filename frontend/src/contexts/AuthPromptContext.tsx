// src/contexts/AuthPromptContext.tsx
// Global "Sign in to continue" prompt (Reddit-style) cho khách chưa đăng nhập.
// Khách vẫn xem được bài viết/bình luận, chỉ bị chặn khi tương tác (like, comment, repost, follow...).
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AuthPromptDrawer } from '@/components/auth/AuthPromptDrawer';

/**
 * Lý do mở prompt - dùng để hiển thị đúng thông điệp cho từng hành động.
 * 'default' dùng cho các route yêu cầu đăng nhập.
 */
export type AuthPromptReason =
  | 'like'
  | 'comment'
  | 'repost'
  | 'follow'
  | 'bookmark'
  | 'report'
  | 'createPost'
  | 'notifications'
  | 'messages'
  | 'stories'
  | 'profile'
  | 'settings'
  | 'default';

interface AuthPromptContextType {
  isOpen: boolean;
  reason: AuthPromptReason;
  openAuthPrompt: (reason?: AuthPromptReason) => void;
  closeAuthPrompt: () => void;
}

const AuthPromptContext = createContext<AuthPromptContextType | undefined>(undefined);

export const useAuthPrompt = () => {
  const context = useContext(AuthPromptContext);
  if (context === undefined) {
    throw new Error('useAuthPrompt must be used within an AuthPromptProvider');
  }
  return context;
};

export const AuthPromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<AuthPromptReason>('default');

  const openAuthPrompt = useCallback((nextReason: AuthPromptReason = 'default') => {
    setReason(nextReason);
    setIsOpen(true);
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AuthPromptContext.Provider value={{ isOpen, reason, openAuthPrompt, closeAuthPrompt }}>
      {children}
      <AuthPromptDrawer />
    </AuthPromptContext.Provider>
  );
};