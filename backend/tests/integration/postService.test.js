// Test tích hợp cho PostService với MongoDB in-memory.
// Bao phủ: tạo bài, feed/phân trang/sort, xoá, archive/restore, user posts.
// Lưu ý: tránh content chứa URL để pre('save') không gọi linkPreviewService ra mạng.
const { connectDB, disconnectDB, clearDB } = require('../helpers/db');

const Post = require('../../models/Post');
const User = require('../../models/User');
const PostService = require('../../services/postService');

const makeUser = (suffix) =>
  User.create({
    _id: `user-${suffix}`,
    googleId: `google-${suffix}`,
    username: `poster_${suffix}`,
    displayName: `Poster ${suffix}`,
    email: `poster-${suffix}@example.com`,
  });

beforeAll(async () => {
  await connectDB();
}, 120000);

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await clearDB();
});

describe('postService.createPost', () => {
  it('tạo bài text-only và tăng postCount của user', async () => {
    await makeUser('a');
    const post = await PostService.createPost('user-a', { content: 'Xin chào' });

    expect(post).toBeTruthy();
    expect(post.content).toBe('Xin chào');
    expect(post.visibility).toBe('public');

    const user = await User.findById('user-a');
    expect(user.postCount).toBe(1);
  });

  it('tạo bài chỉ có ảnh (content rỗng)', async () => {
    await makeUser('a');
    const post = await PostService.createPost('user-a', {
      content: '',
      images: ['https://cdn.example.com/a.jpg'],
    });
    expect(post.images).toEqual(['https://cdn.example.com/a.jpg']);
  });

  it('tạo bài chỉ có video', async () => {
    await makeUser('a');
    const post = await PostService.createPost('user-a', {
      content: '',
      video: 'https://cdn.example.com/v.mp4',
    });
    expect(post.video).toBe('https://cdn.example.com/v.mp4');
  });

  it('ném lỗi khi không có content/ảnh/video', async () => {
    await makeUser('a');
    await expect(PostService.createPost('user-a', { content: '   ' })).rejects.toThrow(
      'Content, image or video is required'
    );
    await expect(PostService.createPost('user-a', {})).rejects.toThrow(
      'Content, image or video is required'
    );
  });

  it('trim content trước khi lưu', async () => {
    await makeUser('a');
    const post = await PostService.createPost('user-a', { content: '  hello  ' });
    expect(post.content).toBe('hello');
  });
});

describe('postService.getPosts', () => {
  it('phân trang đúng và trả pagination đầy đủ', async () => {
    await makeUser('a');
    for (let i = 0; i < 5; i += 1) {
      await PostService.createPost('user-a', { content: `bài ${i}` });
    }

    const page1 = await PostService.getPosts({ page: 1, limit: 2 });
    expect(page1.data).toHaveLength(2);
    expect(page1.pagination).toMatchObject({ page: 1, limit: 2, total: 5, pages: 3 });
    expect(page1.pagination.hasNext).toBe(true);
    expect(page1.pagination.hasPrev).toBe(false);

    const page3 = await PostService.getPosts({ page: 3, limit: 2 });
    expect(page3.data).toHaveLength(1);
    expect(page3.pagination.hasNext).toBe(false);
    expect(page3.pagination.hasPrev).toBe(true);
  });

  it('mặc định sort latest: bài mới nhất lên đầu', async () => {
    await makeUser('a');
    await PostService.createPost('user-a', { content: 'cũ' });
    await PostService.createPost('user-a', { content: 'mới' });

    const res = await PostService.getPosts({ sort: 'latest' });
    expect(res.data[0].content).toBe('mới');
  });

  it('loại trừ bài đã xoá, đã archive và private khỏi feed', async () => {
    await makeUser('a');
    const pub = await PostService.createPost('user-a', { content: 'public' });
    const priv = await PostService.createPost('user-a', { content: 'riêng tư', visibility: 'private' });
    const archived = await PostService.createPost('user-a', { content: 'lưu trữ' });
    await PostService.archivePost(archived._id.toString(), 'user-a');
    const deleted = await PostService.createPost('user-a', { content: 'đã xoá' });
    await PostService.deletePost(deleted._id.toString(), 'user-a');

    const res = await PostService.getPosts({});
    const ids = res.data.map((p) => String(p._id));
    expect(ids).toContain(String(pub._id));
    expect(ids).not.toContain(String(priv._id));
    expect(ids).not.toContain(String(archived._id));
    expect(ids).not.toContain(String(deleted._id));
    expect(res.pagination.total).toBe(1);
  });
});

describe('postService.deletePost', () => {
  it('xoá bài của chính mình (hard delete) và giảm postCount', async () => {
    await makeUser('a');
    const post = await PostService.createPost('user-a', { content: 'xoá tôi' });

    const result = await PostService.deletePost(post._id.toString(), 'user-a');

    expect(result).toMatchObject({ success: true });
    // Service dùng findByIdAndDelete (hard delete) + xoá comments/notifications liên quan.
    expect(await Post.findById(post._id)).toBeNull();
    const user = await User.findById('user-a');
    expect(user.postCount).toBe(0);
  });

  it('ném lỗi Post not found khi bài không tồn tại', async () => {
    await makeUser('a');
    const { Types } = require('mongoose');
    await expect(
      PostService.deletePost(new Types.ObjectId().toString(), 'user-a')
    ).rejects.toThrow('Post not found');
  });

  it('ném lỗi Access denied khi xoá bài của người khác', async () => {
    await makeUser('a');
    await makeUser('b');
    const post = await PostService.createPost('user-a', { content: 'của A' });

    await expect(PostService.deletePost(post._id.toString(), 'user-b')).rejects.toThrow('Access denied');
  });
});

describe('postService.archivePost / restorePost', () => {
  it('archive đặt flag và expiresAt ~30 ngày', async () => {
    await makeUser('a');
    const post = await PostService.createPost('user-a', { content: 'archive tôi' });

    await PostService.archivePost(post._id.toString(), 'user-a');

    const found = await Post.findById(post._id);
    expect(found.isArchived).toBe(true);
    expect(found.archivedAt).toBeTruthy();
    const diffDays = (found.expiresAt - Date.now()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThan(29);
    expect(diffDays).toBeLessThanOrEqual(30);
  });

  it('restore gỡ flag archive', async () => {
    await makeUser('a');
    const post = await PostService.createPost('user-a', { content: 'restore tôi' });
    await PostService.archivePost(post._id.toString(), 'user-a');

    await PostService.restorePost(post._id.toString(), 'user-a');

    const found = await Post.findById(post._id);
    expect(found.isArchived).toBe(false);
  });

  it('không cho archive bài của người khác', async () => {
    await makeUser('a');
    await makeUser('b');
    const post = await PostService.createPost('user-a', { content: 'của A' });

    await expect(PostService.archivePost(post._id.toString(), 'user-b')).rejects.toThrow();
  });
});

describe('postService.getUserPosts', () => {
  it('khách chỉ thấy bài public của user', async () => {
    await makeUser('a');
    await PostService.createPost('user-a', { content: 'public' });
    await PostService.createPost('user-a', { content: 'private', visibility: 'private' });

    const res = await PostService.getUserPosts('user-a', { requesterId: 'user-b' });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].content).toBe('public');
  });

  it('chính chủ thấy cả bài private', async () => {
    await makeUser('a');
    await PostService.createPost('user-a', { content: 'public' });
    await PostService.createPost('user-a', { content: 'private', visibility: 'private' });

    const res = await PostService.getUserPosts('user-a', { requesterId: 'user-a' });
    expect(res.data).toHaveLength(2);
  });

  it('ném lỗi User not found khi user không tồn tại', async () => {
    await expect(PostService.getUserPosts('user-khong-ton-tai', {})).rejects.toThrow('User not found');
  });
});

describe('postService + like (toggleLike của model)', () => {
  it('like rồi unlike cập nhật likeCount đúng', async () => {
    await makeUser('a');
    const post = await PostService.createPost('user-a', { content: 'like tôi' });

    let liked = await (await Post.findById(post._id)).toggleLike('user-b');
    expect(liked).toBe(true);
    expect((await Post.findById(post._id)).likeCount).toBe(1);

    liked = await (await Post.findById(post._id)).toggleLike('user-b');
    expect(liked).toBe(false);
    expect((await Post.findById(post._id)).likeCount).toBe(0);
  });

  it('commentCount phản ánh đúng sau khi bình luận qua CommentService', async () => {
    const CommentService = require('../../services/commentService');
    await makeUser('a');
    const post = await PostService.createPost('user-a', { content: 'bình luận đi' });
    await CommentService.createComment('user-b', post._id, { content: 'hay' });

    const res = await PostService.getPosts({});
    expect(res.data[0].commentCount).toBe(1);
  });
});

