// Test useCreatePost: logic chọn file + submit.
// Ghim [BUG-B1] phía client: body POST /api/posts KHÔNG được chứa video: ''
// và [BUG-B2]: lỗi submit phải reset isSubmitting (không kẹt nút).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreatePost } from '../hooks/useCreatePost';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'vi' },
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <MemoryRouter>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
};

const fileNamed = (name: string, type: string, size = 100) =>
  new File([new ArrayBuffer(size)], name, { type });

const changeEvent = (files: File[]) =>
  ({ target: { files, value: '' } }) as unknown as React.ChangeEvent<HTMLInputElement>;

const videoEvent = (file: File | null) =>
  ({
    target: { files: file ? [file] : [], value: '' },
  }) as unknown as React.ChangeEvent<HTMLInputElement>;

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('auth_token', 'token-test');
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      String(url).endsWith('/api/posts')
        ? okJson({ success: true, data: { _id: 'p1' } })
        : okJson({ success: true, data: [] })
    )
  );
});

describe('useCreatePost - chọn file', () => {
  it('chỉ nhận file ảnh, loại file khác', () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    act(() => {
      result.current.handleImageSelect(
        changeEvent([fileNamed('a.png', 'image/png'), fileNamed('doc.pdf', 'application/pdf')])
      );
    });
    expect(result.current.images).toHaveLength(1);
  });

  it('loại ảnh quá 10MB', () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    act(() => {
      result.current.handleImageSelect(changeEvent([fileNamed('big.png', 'image/png', 11 * 1024 * 1024)]));
    });
    expect(result.current.images).toHaveLength(0);
  });

  it('giới hạn tối đa maxImages ảnh', () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    const five = [0, 1, 2, 3, 4].map((i) => fileNamed(`${i}.png`, 'image/png'));
    act(() => {
      result.current.handleImageSelect(changeEvent(five));
    });
    expect(result.current.images).toHaveLength(result.current.maxImages);
  });

  it('chọn video thì clear ảnh', () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    act(() => {
      result.current.handleImageSelect(changeEvent([fileNamed('a.png', 'image/png')]));
      result.current.handleVideoSelect(videoEvent(fileNamed('v.mp4', 'video/mp4')));
    });
    expect(result.current.video).not.toBeNull();
    expect(result.current.images).toHaveLength(0);
  });

  it('removeImage / clearAllImages / removeVideo', () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    act(() => {
      result.current.handleImageSelect(
        changeEvent([fileNamed('a.png', 'image/png'), fileNamed('b.png', 'image/png')])
      );
    });
    act(() => result.current.removeImage(0));
    expect(result.current.images).toHaveLength(1);
    act(() => result.current.clearAllImages());
    expect(result.current.images).toHaveLength(0);
  });
});


describe('useCreatePost - submit', () => {
  it('không submit khi form trống', async () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('[BUG-B1] body gửi lên KHÔNG chứa video rỗng', async () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    act(() => {
      result.current.setContent('bài text-only');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as Array<[string, RequestInit]>;
    const createCall = calls.find(([url, init]) => url.endsWith('/api/posts') && init?.method === 'POST');
    expect(createCall).toBeTruthy();
    const body = JSON.parse(createCall![1].body as string);
    // Backend Zod url() reject '' -> key video phải vắng mặt hoàn toàn.
    expect('video' in body).toBe(false);
    expect(body.content).toBe('bài text-only');
  });

  it('submit thành công thì clear form', async () => {
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    act(() => {
      result.current.setContent('xong thì xoá');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.content).toBe('');
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  it('[BUG-B2] submit lỗi thì isSubmitting phải reset (không kẹt nút)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve('Validation failed'),
        } as Response)
      )
    );
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    act(() => {
      result.current.setContent('sẽ lỗi');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});
