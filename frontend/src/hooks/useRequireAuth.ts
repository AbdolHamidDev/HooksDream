// src/hooks/useRequireAuth.ts
// Guard cho mọi hành động cần đăng nhập.
// Trả về false (và mở drawer) nếu khách chưa đăng nhập, để caller dừng ngay.
import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuthPrompt, type AuthPromptReason } from '@/contexts/AuthPromptContext';

export const useRequireAuth = () => {
  const { isConnected, user } = useAppStore();
  const { openAuthPrompt } = useAuthPrompt();

  return useCallback(
    (reason: AuthPromptReason = 'default'): boolean => {
      if (!isConnected || !user) {
        openAuthPrompt(reason);
        return false;
      }
      return true;
    },
    [isConnected, user, openAuthPrompt]
  );
};

export default useRequireAuth;