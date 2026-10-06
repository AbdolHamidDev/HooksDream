// Test postApi service: URL + method đúng contract với backend routes/posts.js.
// [BUG-B3] unlikePost gọi POST /:id/unlike — route KHÔNG tồn tại (backend
// chỉ có /:id/like toggle). Test này ĐỎ cho đến khi hàm chết bị xoá.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postApi } from '../postApi';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('auth_token', 'token-test');
  fetchMock.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

const lastCall = () => {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init };
};

describe('postApi - contract URL/method với backend', () => {
  it('getPosts truyền page/limit/sort', async () => {
    await postApi.getPosts({ page: 2, limit: 10, sort: 'latest' });
    const { url } = lastCall();
    expect(url).toContain('/api/posts?');
    expect(url).toContain('page=2');
    expect(url).toContain('sort=latest');
  });

  it('createPost POST /api/posts với JSON body', async () => {
    await postApi.createPost({ content: 'hi', visibility: 'public' });
    const { url, init } = lastCall();
    expect(url.endsWith('/api/posts')).toBe(true);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toMatchObject({ content: 'hi' });
  });

  it('likePost dùng POST /:id/like (toggle)', async () => {
    await postApi.likePost('p1');
    const { url, init } = lastCall();
    expect(url.endsWith('/api/posts/p1/like')).toBe(true);
    expect(init.method).toBe('POST');
  });

  it('[BUG-B3] unlikePost dùng chung endpoint toggle /like (không có /unlike)', async () => {
    await postApi.unlikePost('p1');
    const { url, init } = lastCall();
    expect(url.endsWith('/api/posts/p1/like')).toBe(true);
    expect(init.method).toBe('POST');
    expect(url).not.toContain('/unlike');
  });

  it('deletePost DELETE /:id, archive/restore PATCH', async () => {
    await postApi.deletePost('p1');
    expect(lastCall().init.method).toBe('DELETE');

    await postApi.archivePost('p1');
    const archive = lastCall();
    expect(archive.url.endsWith('/api/posts/p1/archive')).toBe(true);
    expect(archive.init.method).toBe('PATCH');

    await postApi.restorePost('p1');
    expect(lastCall().init.method).toBe('PATCH');
  });

  it('getArchivedPosts / getPost / getUserPosts đúng URL', async () => {
    await postApi.getArchivedPosts({ page: 1 });
    expect(lastCall().url).toContain('/api/posts/archived');

    await postApi.getPost('p1');
    expect(lastCall().url.endsWith('/api/posts/p1')).toBe(true);

    await postApi.getUserPosts('u1', { page: 1 });
    expect(lastCall().url).toContain('/api/posts/user/u1');
  });

  it('repostPost POST /:id/repost, sharePost POST /:id/share', async () => {
    await postApi.repostPost('p1', 'hay');
    const repost = lastCall();
    expect(repost.url.endsWith('/api/posts/p1/repost')).toBe(true);
    expect(JSON.parse(repost.init.body as string)).toMatchObject({ content: 'hay' });

    await postApi.sharePost('p1');
    expect(lastCall().url.endsWith('/api/posts/p1/share')).toBe(true);
  });

  it('uploadImage reject sai MIME trước khi gọi mạng', async () => {
    const bad = new File([new ArrayBuffer(10)], 'a.pdf', { type: 'application/pdf' });
    await expect(postApi.uploadImage(bad)).rejects.toThrow('Invalid file type');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uploadVideo reject sai MIME trước khi gọi mạng', async () => {
    const bad = new File([new ArrayBuffer(10)], 'a.png', { type: 'image/png' });
    await expect(postApi.uploadVideo(bad)).rejects.toThrow('Invalid file type');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
