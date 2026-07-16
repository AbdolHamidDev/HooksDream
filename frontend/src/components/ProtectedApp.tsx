// ProtectedApp.tsx - Enhanced with Framer Motion transitions
import React, { Suspense, useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from "@/store/useAppStore";
import { useSocket } from "@/hooks/useSocket";
import ModernAuthConnect from "@/components/auth/ModernAuthConnect";
import { PageLayout } from "@/components/layout/PageLayout";
import { useChatContext } from "@/contexts/ChatContext";
import { UnfollowConfirmProvider } from "@/contexts/UnfollowConfirmContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ToastProvider } from "@/components/ui/SuccessToast";
// Lazy load ALL components for better performance and faster navigation
const AnimatedRoutes = React.lazy(() => import("@/components/navigation/AnimatedRoutes"));
const SearchPage = React.lazy(() => import("@/pages/SearchPage"));
const ProfilePage = React.lazy(() => import("@/pages/ProfilePage"));
const PostDetailPage = React.lazy(() => import("@/pages/PostDetailPage"));
const EditProfilePage = React.lazy(() => import("@/pages/EditProfilePage"));
const CreatePostPage = React.lazy(() => import("@/pages/CreatePostPage").then(module => ({ default: module.CreatePostPage })));
const MessagesPage = React.lazy(() => import("@/pages/MessagesPage"));
const NotificationsPage = React.lazy(() => import("@/pages/NotificationsPage"));
const FriendPage = React.lazy(() => import("@/pages/MobileFriendPage"));
const StoriesPage = React.lazy(() => import("@/pages/StoriesPage").then(module => ({ default: module.StoriesPage })));

const ProtectedAppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, user, profile } = useAppStore();
  const { selectedConversationId } = useChatContext();
  const { isConnected: socketConnected, connectionError } = useSocket();
  
  // Check persistent session to prevent flash
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Use SessionManager to check for valid session
        const { SessionManager } = await import('@/utils/sessionManager');
        const savedSession = SessionManager.getAuthSession();
        
        if (savedSession && savedSession.user) {
          
          // Valid session exists, populate store if needed
          if (!isConnected || !user) {
            const { setIsConnected, setUser, setProfile } = useAppStore.getState();
            setIsConnected(true);
            setUser(savedSession.user);
            setProfile(savedSession.profile || savedSession.user);
          }
          
          // Auto redirect to feed if on root path
          if (location.pathname === '/') {
            navigate('/feed', { replace: true });
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
      setIsCheckingSession(false);
    };
    
    checkSession();
  }, [isConnected, user, location.pathname, navigate]);
  
  // Check if current page should hide sidebars
  const isEditProfilePage = location.pathname === '/edit-profile' || location.pathname.startsWith('/edit-profile/');
  const isCreatePostPage = location.pathname === '/post';
  const isMessagesPage = location.pathname.startsWith('/messages');
  
  const isSearchPage = location.pathname === '/search';
  const isStoriesPage = location.pathname === '/stories'; // Stories = full-screen
  
  // MobileHeader only shows on feed (hide on messages, search, etc.)
  const shouldShowMobileHeader = (location.pathname === '/feed' || location.pathname === '/') && !isSearchPage && !isMessagesPage;

  // Determine layout mode
  const isFullWidthPage = isStoriesPage || isEditProfilePage || isCreatePostPage || isMessagesPage;

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 flex items-center justify-center mx-auto">
            <img 
              src="/logo.png" 
              alt="HooksDream Logo" 
              className="w-20 h-20 object-contain animate-pulse" 
            />
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading HooksDream...</p>
        </div>
      </div>
    );
  }

  if (!isConnected || !user) {
    return <ModernAuthConnect />;
  }

  return (
    <UnfollowConfirmProvider>
      <PageLayout
        showSidebars={!isFullWidthPage}
        showMobileHeader={shouldShowMobileHeader}
        showBottomNav={!isFullWidthPage}
        fullWidth={isFullWidthPage}
      >
        <ToastProvider>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          }>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                {/* Profile pages - Motion transitions */}
                <Route path="/profile/:userId" element={
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <ProfilePage />
                  </motion.div>
                } />
                <Route path="/profile/me" element={
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <ProfilePage />
                  </motion.div>
                } />
                
                {/* Post detail - Motion transitions */}
                <Route path="/post/:postId" element={
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <PostDetailPage />
                  </motion.div>
                } />
                
                {/* Search page - Special motion */}
                <Route path="/search" element={
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="h-full"
                  >
                    <SearchPage />
                  </motion.div>
                } />
                
                {/* Stories page */}
                <Route path="/stories" element={<StoriesPage />} />
                
                {/* Edit Profile page */}
                <Route path="/edit-profile/:address" element={<EditProfilePage />} />
                <Route path="/edit-profile" element={<EditProfilePage />} />
                
                {/* Create Post page */}
                <Route path="/post" element={<CreatePostPage />} />
                
                {/* Messages page */}
                <Route path="/messages/*" element={<MessagesPage />} />
                
                {/* AnimatedRoutes handles: /, /feed, /friend, /notifications */}
                <Route path="/*" element={<AnimatedRoutes />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </ToastProvider>
      </PageLayout>
    </UnfollowConfirmProvider>
  );
};

const ProtectedAppSimple: React.FC = () => {
  return (
    <ChatProvider>
      <ProtectedAppContent />
    </ChatProvider>
  );
};

export default ProtectedAppSimple;
