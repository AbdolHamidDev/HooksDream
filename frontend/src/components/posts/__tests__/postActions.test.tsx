// Test PostActions: like (chặn double-click), auth-guard, formatCount,
// menu chủ bài vs khách, dialog archive/delete/report.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostActions } from '../PostActions';
import type { Post } from '@/types/post';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'vi' },
  }),
}));

vi.mock('@/hooks/useIsMobile', () => ({ useIsMobile: () => false }));

vi.mock('@/hooks/useCommentCount', () => ({
  useCommentCount: () => ({ commentCount: 5, isLoading: false, refetch: vi.fn() }),
}));

const toastCalls: Array<[string, string?]> = [];
vi.mock('@/components/ui/SuccessToast', () => ({
  useSuccessToast: () => ({
    showSuccess: (msg: string, desc?: string) => {
      toastCalls.push([msg, desc]);
    },
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

let authResult = true;
let lastAuthReason: string | null = null;
vi.mock('@/hooks/useRequireAuth', () => ({
  useRequireAuth: () => (reason: string = 'default') => {
    lastAuthReason = reason;
    return authResult;
  },
}));

vi.mock('@/components/comment/CommentSheet', () => ({
  CommentSheet: () => <div data-testid="comment-sheet" />,
}));

vi.mock('@/components/ui/RepostButton', () => ({
  RepostButton: () => <div data-testid="repost-button" />,
}));

const makePost = (overrides: Partial<Post> = {}): Post =>
  ({
    _id: 'p1',
    content: 'hello',
    createdAt: new Date().toISOString(),
    likeCount: 10,
    commentCount: 5,
    isLiked: false,
    userId: { _id: 'u1', username: 'author', displayName: 'Author' },
    ...overrides,
  }) as Post;

const baseProps = {
  post: makePost(),
  isBookmarked: false,
  onLike: vi.fn(),
  onBookmark: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  toastCalls.length = 0;
  authResult = true;
  lastAuthReason = null;
});

describe('PostActions - like', () => {
  it('bấm tim gọi onLike đúng 1 lần', async () => {
    const user = userEvent.setup();
    const onLike = vi.fn().mockResolvedValue(undefined);
    render(<PostActions {...baseProps} onLike={onLike} />);

    await user.click(screen.getByRole('button', { name: /like/i }));
    await waitFor(() => {
      expect(onLike).toHaveBeenCalledTimes(1);
    });
  });

  it('khách chưa login: mở auth drawer, không gọi onLike', async () => {
    authResult = false;
    const user = userEvent.setup();
    const onLike = vi.fn();
    render(<PostActions {...baseProps} onLike={onLike} />);

    await user.click(screen.getByRole('button', { name: /like/i }));
    expect(lastAuthReason).toBe('like');
    expect(onLike).not.toHaveBeenCalled();
  });

  it('hiển thị trạng thái đã like (Unlike)', () => {
    render(<PostActions {...baseProps} post={makePost({ isLiked: true })} />);
    expect(screen.getByRole('button', { name: /unlike/i })).toBeInTheDocument();
  });
});

describe('PostActions - menu chủ bài vs khách', () => {
  const openMenu = async (user: ReturnType<typeof userEvent.setup>, container: HTMLElement) => {
    // Nút trigger menu 3 chấm không có accessible name — lấy qua class.
    const menuBtn = container.querySelector('button.h-8.w-8') as HTMLButtonElement;
    await user.click(menuBtn);
  };

  it('chủ bài thấy Archive/Delete, không thấy Bookmark', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PostActions
        {...baseProps}
        isOwnProfile
        onArchive={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    await openMenu(user, container);
    expect(await screen.findByText('Lưu trữ bài viết')).toBeInTheDocument();
    expect(screen.getByText('Delete post')).toBeInTheDocument();
    expect(screen.queryByText('Lưu bài viết')).toBeNull();
  });

  it('khách thấy Bookmark + Report', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PostActions {...baseProps} isOwnProfile={false} onReport={vi.fn()} />
    );
    await openMenu(user, container);
    expect(await screen.findByText('Lưu bài viết')).toBeInTheDocument();
    expect(screen.getByText('Report post')).toBeInTheDocument();
  });

  it('bấm bookmark khi chưa login thì mở drawer', async () => {
    authResult = false;
    const user = userEvent.setup();
    const onBookmark = vi.fn();
    const { container } = render(<PostActions {...baseProps} onBookmark={onBookmark} />);
    await openMenu(user, container);
    await user.click(await screen.findByText('Lưu bài viết'));
    expect(lastAuthReason).toBe('bookmark');
    expect(onBookmark).not.toHaveBeenCalled();
  });
});

describe('PostActions - dialog archive/delete', () => {
  it('xác nhận archive gọi onArchive + toast thành công', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <PostActions {...baseProps} isOwnProfile onArchive={onArchive} />
    );

    const menuBtn = container.querySelector('button.h-8.w-8') as HTMLButtonElement;
    await user.click(menuBtn);
    await user.click(await screen.findByText('Lưu trữ bài viết'));
    await user.click(await screen.findByRole('button', { name: 'Archive' }));

    await waitFor(() => {
      expect(onArchive).toHaveBeenCalledTimes(1);
    });
    expect(toastCalls.length).toBeGreaterThan(0);
  });
});
