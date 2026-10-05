// ProfilePageContent.tsx - React Query Version ⚡
import React, { useRef, useState, useEffect } from 'react';
import { useProfileWithPosts, usePrefetchProfile } from '@/hooks/useProfileQuery';
import { api } from '@/services/api';
import { setGlobalEditingState } from '@/hooks/useGoogleAuth';
import { useParams } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import EditProfileModal from '@/components/profile/edit/EditProfileModal';
import { FollowerListModal } from './FollowerListModal';
import { ProfileCover } from './ProfileCover';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { ProfileSkeleton, ProfileError, UserNotFound } from './LoadingStates';

export const ProfilePageContent: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useAppStore(state => state.user);
  
  // ✅ Hook Web3Auth để có refreshUserData
  const { isConnected } = useGoogleAuth();

  // ✅ Scroll to top khi navigate đến profile page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [userId]); // Dependency array với userId để scroll khi chuyển giữa các profile khác nhau
  
  const possibleCurrentUserId = currentUser?._id || currentUser?.id;
  
  // ✅ Ref để track editing state và prevent Web3Auth overwrite
  const isEditingRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hasMorePosts = true;

  // ⚡ React Query hooks - instant loading với aggressive caching
  const {
    user,
    profile,
    posts,
    mediaPosts,
    repostPosts,
    loading,
    postsLoading,
    error,
    isOwnProfile,
    refetch
  } = useProfileWithPosts(userId || '', possibleCurrentUserId);

  // ⚡ Prefetch utility
  const prefetchProfile = usePrefetchProfile();

  // ✅ Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Handler functions
  const handleComment = (postId: string) => {
    console.log("Comment on", postId);
  };

  const handleShare = (postId: string) => {
    console.log("Share", postId);
  };

const handleEditProfile = async () => {
  setGlobalEditingState(true);
  
  // ✅ Không cần refresh - data đã fresh từ cache hoặc recent load
  console.log('✏️ Opening edit profile modal...');
  
  setIsEditingProfile(true);
  console.log('Edit profile started - Web3Auth sync disabled');
};

  const handleLikePost = (postId: string) => {
    // TODO: Implement like mutation với React Query
    console.log("Like post:", postId);
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        const response = await api.post.deletePost(postId);
        if (response.success) {
          // Refresh profile data to update post count and remove deleted post
          window.location.reload(); // Simple solution for now
        } else {
          alert('Không thể xóa bài viết. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Có lỗi xảy ra khi xóa bài viết.');
      }
    }
  };

  // ⚡ Simple handleSaveProfile (placeholder for now)
  const handleSaveProfile = async (updatedData: any) => {
    try {
      console.log('💾 Saving profile:', updatedData);
      
      // Reset editing flag và đóng modal
      isEditingRef.current = false;
      setIsEditingProfile(false);
      
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      
      // Reset editing flag nếu có lỗi
      isEditingRef.current = false;
      
      throw error;
    }
  };

  // ✅ Handle close modal
const handleCloseEditModal = () => {
  setIsEditingProfile(false);
  setTimeout(() => {
    setGlobalEditingState(false);
    console.log('Edit profile closed - Web3Auth sync re-enabled');
  }, 1000);
};

  const handleOpenFollowers = () => {
    setIsFollowersModalOpen(true);
  };

  const handleOpenFollowing = () => {
    setIsFollowingModalOpen(true);
  };

  const handleCloseFollowers = () => {
    setIsFollowersModalOpen(false);
  };

  const handleCloseFollowing = () => {
    setIsFollowingModalOpen(false);
  };

  // Render conditions
  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return <ProfileError error={error} onRetry={refetch} />;
  }

  if (!user) {
    return <UserNotFound />;
  }

  // Convert User type to Profile type
  const profileData = {
    ...user,
    name: user.name || user.displayName || user.username || 'User',
    displayName: user.displayName || user.name || user.username || 'User',
    username: user.username || 'user',
    followerCount: user.followerCount || 0,
    followingCount: user.followingCount || 0,
    postCount: user.postCount || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <ProfileCover coverImage={user.coverImage} />

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        {/* Profile Header */}
        <ProfileHeader
          user={profileData}
          isOwnProfile={isOwnProfile}
          onEditProfile={handleEditProfile}
          onOpenFollowers={handleOpenFollowers}
          onOpenFollowing={handleOpenFollowing}
        />

        {/* Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          posts={posts}
          mediaPosts={mediaPosts}
          repostPosts={repostPosts}
          postsLoading={postsLoading}
          isOwnProfile={isOwnProfile}
          user={profileData}
          onLike={handleLikePost}
          onDelete={handleDeletePost}
          onComment={handleComment}
          onShare={handleShare}
          hasMorePosts={hasMorePosts}
          loadMoreRef={loadMoreRef}
        />
      </div>

      {/* ✅ Edit Profile Modal với handler đã update */}
      {isEditingProfile && user && (
        <EditProfileModal
          isOpen={isEditingProfile}
          onClose={handleCloseEditModal} // ✅ Sử dụng handler có logic reset flag
          user={user} // Use fresh data from refresh() 
          onSave={handleSaveProfile} // ✅ Handler có tích hợp refreshUserData
        />
      )}

      {/* Modal cho followers */}
      {user._id && (
        <>
          <FollowerListModal
            isOpen={isFollowersModalOpen}
            onClose={handleCloseFollowers}
            userId={user._id}
            currentUserId={possibleCurrentUserId || ''}
            type="followers"
          />
          
          <FollowerListModal
            isOpen={isFollowingModalOpen}
            onClose={handleCloseFollowing}
            userId={user._id}
            currentUserId={possibleCurrentUserId || ''}
            type="following"
          />
        </>
      )}
    </div>
  );
};