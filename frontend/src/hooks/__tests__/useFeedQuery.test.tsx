// Test useFeedQuery: optimistic like/delete + rollback khi lỗi + phân trang.
// Mock @/services/api để không gọi mạng.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Factory của vi.mock bị hoist nên phải dùng vi.hoisted để tạo mock.
const { apiPostMock } = vi.hoisted(() => ({
  apiPostMock: { getPosts: vi.fn(), likePost: vi.fn(), deletePost: vi.fn() },
}));

vi.mock('@/services/api', () => ({
  api: { post: apiPostMock },
}));

import { useFeedQuery, feedQueryKeys } from '../useFeedQuery';
import type { Post } from '@/types/post';

const makePost = (overrides: Partial<Post> = {}): Post =>
  ({
    _id: 'p1',
    content: 'hello',
    createdAt: new Date().toISOString(),
    likeCount: 10,
    commentCount: 0,
    isLiked: false,
    userId: { _id: 'u1', username: 'author', displayName: 'Author' },
    ...overrides,
  }) as Post;

const pageOf = (posts: Post[], page = 1, hasNext = false) => ({
  success: true,
  data: posts,
  pagination: { page, limit: 10, total: posts.length, pages: 1, hasNext, hasPrev: false },
});

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 10 * 60 * 1000, staleTime: Infinity } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  vi.clearAllMocks();
  apiPostMock.getPosts.mockResolvedValue(pageOf([makePost()]));
  apiPostMock.likePost.mockResolvedValue({ success: true });
  apiPostMock.deletePost.mockResolvedValue({ success: true });
});

describe('useFeedQuery - load feed', () => {
  it('trả posts đã flatten từ các page', async () => {
    const { result } = renderHook(() => useFeedQuery(), { wrapper });
    await waitFor(() => {
      expect(result.current.totalPosts).toBe(1);
    });
    expect(result.current.posts[0]).toMatchObject({ _id: 'p1' });
    expect(result.current.isError).toBe(false);
  });

  it('loadMore gọi fetchNextPage khi còn trang', async () => {
    apiPostMock.getPosts
      .mockResolvedValueOnce(pageOf([makePost()], 1, true))
      .mockResolvedValueOnce(pageOf([makePost({ _id: 'p2' })], 2, false));

    const { result } = renderHook(() => useFeedQuery(), { wrapper });
    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });

    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.totalPosts).toBe(2);
    });
  });
});

describe('useFeedQuery - like optimistic', () => {
  it('like cập nhật isLiked + likeCount ngay, rồi gọi API', async () => {
    const { result } = renderHook(() => useFeedQuery(), { wrapper });
    await waitFor(() => {
      expect(result.current.totalPosts).toBe(1);
    });
    // Chặn refetch sau mutation để giữ snapshot optimistic trong test.
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined as never);

    act(() => {
      result.current.likePost('p1');
    });

    await waitFor(() => {
      expect(result.current.posts[0]).toMatchObject({ isLiked: true, likeCount: 11 });
    });
    expect(apiPostMock.likePost).toHaveBeenCalledWith('p1');
    invalidateSpy.mockRestore();
  });

  it('like lỗi thì rollback về trạng thái cũ', async () => {
    apiPostMock.likePost.mockRejectedValue(new Error('Network down'));
    const { result } = renderHook(() => useFeedQuery(), { wrapper });
    await waitFor(() => {
      expect(result.current.totalPosts).toBe(1);
    });

    act(() => {
      result.current.likePost('p1');
    });

    await waitFor(() => {
      expect(apiPostMock.likePost).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(result.current.posts[0]).toMatchObject({ isLiked: false, likeCount: 10 });
    });
  });
});

describe('useFeedQuery - delete optimistic', () => {
  it('delete xoá post khỏi cache ngay', async () => {
    const { result } = renderHook(() => useFeedQuery(), { wrapper });
    await waitFor(() => {
      expect(result.current.totalPosts).toBe(1);
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined as never);

    act(() => {
      result.current.deletePost('p1');
    });

    await waitFor(() => {
      expect(result.current.totalPosts).toBe(0);
    });
    expect(apiPostMock.deletePost).toHaveBeenCalledWith('p1');
    invalidateSpy.mockRestore();
  });

  it('delete lỗi thì rollback, post xuất hiện lại', async () => {
    apiPostMock.deletePost.mockRejectedValue(new Error('Network down'));
    const { result } = renderHook(() => useFeedQuery(), { wrapper });
    await waitFor(() => {
      expect(result.current.totalPosts).toBe(1);
    });

    act(() => {
      result.current.deletePost('p1');
    });

    await waitFor(() => {
      expect(apiPostMock.deletePost).toHaveBeenCalled();
    });
    await waitFor(
      () => {
        expect(result.current.totalPosts).toBe(1);
      },
      { timeout: 3000 }
    );
  });
});

describe('feedQueryKeys', () => {
  it('key infinite ổn định', () => {
    expect(feedQueryKeys.infinite()).toEqual(['feed', 'posts', 'infinite']);
  });
});
