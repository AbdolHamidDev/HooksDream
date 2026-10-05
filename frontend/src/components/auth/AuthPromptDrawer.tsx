// src/components/auth/AuthPromptDrawer.tsx
// Bottom-sheet (vaul) hiển thị khi khách chưa đăng nhập tương tác với bài viết.
// Giống Reddit: nội dung bài viết vẫn xem được, chỉ chặn hành động cần tài khoản.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/Button';
import SimpleGoogleLogin from '@/components/auth/SimpleGoogleLogin';
import { useAppStore } from '@/store/useAppStore';
import { useAuthPrompt } from '@/contexts/AuthPromptContext';

export const AuthPromptDrawer: React.FC = () => {
  const { t } = useTranslation('common');
  const { isOpen, reason, openAuthPrompt, closeAuthPrompt } = useAuthPrompt();
  const { isConnected, user } = useAppStore();
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Đóng drawer sau khi đăng nhập thành công (không cần reload trang)
  useEffect(() => {
    if (isOpen && isConnected && user) {
      closeAuthPrompt();
    }
  }, [isOpen, isConnected, user, closeAuthPrompt]);

  // Mỗi lần mở lại -> reset lựa chọn đồng ý điều khoản
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setAgreeTerms(false);
      openAuthPrompt(reason);
      return;
    }
    closeAuthPrompt();
  };

  const reasonKey = `authPrompt.reason.${reason}`;
  const description = t(reasonKey, t('authPrompt.reason.default'));

  return (
    <Drawer
      open={isOpen}
      onOpenChange={handleOpenChange}
      shouldScaleBackground={false}
    >
      <DrawerContent className="max-h-[85vh] overflow-y-auto pb-6">
        <DrawerTitle className="sr-only">{t('authPrompt.title')}</DrawerTitle>

        <div className="px-5 pt-1 pb-2 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>

          <h2 className="text-lg font-semibold text-foreground">
            {t('authPrompt.title')}
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Terms agreement - giữ đúng luật của ModernAuthConnect */}
        <div className="px-5 pt-2">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="authPrompt-agreeTerms"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
              className="w-4 h-4 mt-0.5 rounded border-border text-foreground focus:ring-2 focus:ring-foreground focus:ring-offset-0"
            />
            <label
              htmlFor="authPrompt-agreeTerms"
              className="text-sm text-muted-foreground leading-relaxed"
            >
              {t('auth.agreeToTerms')}{' '}
              <a
                href="/terms-of-use"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline"
              >
                {t('auth.termsOfService')}
              </a>
            </label>
          </div>
        </div>

        {/* Google Login */}
        <div className="px-5 pt-4">
          {agreeTerms ? (
            <SimpleGoogleLogin
              redirectTo={null}
              onSuccess={closeAuthPrompt}
            />
          ) : (
            <div className="p-4 border border-dashed border-border rounded-lg text-center text-muted-foreground text-sm">
              {t('auth.pleaseAgreeTerms')}
            </div>
          )}
        </div>

        {/* Tiếp tục xem không cần đăng nhập */}
        <div className="px-5 pt-4">
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full">
              {t('authPrompt.continueBrowsing')}
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AuthPromptDrawer;