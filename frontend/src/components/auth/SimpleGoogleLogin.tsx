import React, { useEffect, useRef } from 'react';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useLoginLoading } from '@/hooks/useLoginLoading';
import { useAuth } from '@/hooks/useAuth';

interface SimpleGoogleLoginProps {
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

const SimpleGoogleLogin: React.FC<SimpleGoogleLoginProps> = ({ onSuccess, onError }) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { handleCredentialResponse } = useAuth();
  const { isVisible, message, showProgressiveLogin, hideLoading } = useLoginLoading();

  // Wrapper to integrate with useAuth hook
  const handleCredentialResponseWrapper = async (response: any) => {
    try {
      console.log('Google credential received:', response.credential ? 'Yes' : 'No');
      
      // Show progressive loading with React components
      showProgressiveLogin();
      
      // Use the unified auth hook
      await handleCredentialResponse(response);
      
      if (onSuccess) onSuccess(response);
      
      // Smooth transition to feed
      setTimeout(() => {
        window.location.href = '/feed';
      }, 1800);
    } catch (error) {
      console.error('Login error:', error);
      hideLoading();
      if (onError) onError(error);
    }
  };

  // Initialize Google Auth
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        console.log('Initializing Google Auth...');
        
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponseWrapper,
        });

        // Render button
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: buttonRef.current.offsetWidth || 320
        });
      }
    };

    // Load Google script if not loaded
    if (!window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = initializeGoogle;
      document.head.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, [handleCredentialResponseWrapper]);


  return (
    <>
      <div className="w-full">
        <div ref={buttonRef} className="w-full flex justify-center" />
      </div>
      
      {/* Loading overlay with theme support */}
      <LoadingOverlay 
        isVisible={isVisible}
        message={message}
      />
    </>
  );
};

export default SimpleGoogleLogin;
