// Test feed render: EmptyState (CTA -> /post), PostItem (nội dung,
// like optimistic, cắt content dài, media).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { EmptyState } from '../EmptyState';
import { PostItem } from '../PostItem';
import type { Post } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi' },
  }),
}));

vi.mock('@/hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({ isConnected: true, user: { _id: 'me' } }),
}));

vi.mock('../MediaWithFallback', () => ({
  MediaWithFallback: () => <div data-testid="media-fallback" />,
}));
vi.mock('../CachedImage', () => ({
  CachedImage: () => <div data-testid="cached-image" />,
  useImagePreloader: () => ({ preloadImages: vi.fn() }),
}));
vi.mock('../CachedVideo', () => ({
  CachedVideo: () => <div data-testid="cached-video" />,
  useVideoCache: () => ({ preloadVideoMetadata: vi.fn() }),
}));

const makePost = (overrides: Partial<Post> = {}): Post =>
  ({
    _id: 'p1',
    content: 'nội dung bài viết',
    createdAt: new Date().toISOString(),
    likeCount: 3,
    commentCount: 0,
    isLiked: false,
    images: [],
    userId: { _id: 'u1', username: 'author', displayName: 'Author', avatar: '' },
    ...overrides,
  }) as Post;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EmptyState', () => {
  it('nút CTA dẫn tới /post', async () => {
    const user = userEvent.setup();
    let path = '';
    const Probe = () => {
      path = useLocation().pathname;
      return null;
    };
    render(
      <MemoryRouter initialEntries={['/feed']}>
        <Routes>
          <Route path="/feed" element={<EmptyState />} />
          <Route path="/post" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button'));
    expect(path).toBe('/post');
  });
});

describe('PostItem', () => {
  const base = { onLike: vi.fn(), onFollow: vi.fn(), isFollowLoading: false };

  it('render tên tác giả + nội dung + số like', () => {
    render(
      <MemoryRouter>
        <PostItem post={makePost()} {...base} />
      </MemoryRouter>
    );
    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(screen.getByText('nội dung bài viết')).toBeInTheDocument();
  });

  it('like optimistic: bấm tim gọi onLike với đúng postId', async () => {
    const user = userEvent.setup();
    const onLike = vi.fn();
    render(
      <MemoryRouter>
        <PostItem post={makePost()} {...base} onLike={onLike} />
      </MemoryRouter>
    );
    await user.click(screen.getByRole('button', { name: '3' }));
    expect(onLike).toHaveBeenCalledWith('p1');
  });

  it('cắt content dài quá 150 ký tự + nút xem thêm', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PostItem post={makePost({ content: 'x'.repeat(200) })} {...base} />
      </MemoryRouter>
    );
    expect(screen.getByText(/x{150}\.\.\./)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'common.readMore' }));
    expect(screen.queryByText(/x{150}\.\.\./)).toBeNull();
  });
});
