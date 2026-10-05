// src/components/routing/RequireAuthRoute.tsx
// Chặn route yêu cầu đăng nhập: nếu là khách thì mở drawer đăng nhập và không render page.
// Không navigate để tránh loop với drawer.
import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuthPrompt, type AuthPromptReason } from '@/contexts/AuthPromptContext';

interface RequireAuthRouteProps {
  children: React.ReactNode;
  reason?: AuthPromptReason;
}

export const RequireAuthRoute: React.FC<RequireAuthRouteProps> = ({
  children,
  reason = 'default',
}) => {
  const { isConnected, user } = useAppStore();
  const { openAuthPrompt } = useAuthPrompt();

  useEffect(() => {
    if (!isConnected || !user) {
      openAuthPrompt(reason);
    }
  }, [isConnected, user, openAuthPrompt, reason]);

  if (!isConnected || !user) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuthRoute;