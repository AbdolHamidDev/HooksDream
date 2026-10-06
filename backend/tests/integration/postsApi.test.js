// Test HTTP end-to-end cho routes/posts bằng supertest + MongoDB in-memory.
// Bao phủ: auth (401), tạo bài (201), validation (400), CRUD, like toggle,
// archive/restore, share/repost, feed/search/trending/user-posts.
// Lưu ý: tránh content chứa URL để pre('save') không gọi linkPreviewService ra mạng.
//
// [BUG-B1] POST /api/posts với payload y hệt frontend (video: '') hiện trả 400.
// [BUG-B3] POST /:id/unlike không tồn tại -> 404 (backend chỉ có /:id/like toggle).
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../helpers/db');
const { buildPostsApp } = require('../helpers/app');

const User = require('../../models/User');
const Post = require('../../models/Post');

const app = buildPostsApp();

const makeUser = (suffix, overrides = {}) =>
  User.create({
    _id: `http-user-${suffix}`,
    googleId: `http-google-${suffix}`,
    username: `http_poster_${suffix}`,
    displayName: `HTTP Poster ${suffix}`,
    email: `http-poster-${suffix}@example.com`,
    ...overrides,
  });

const tokenFor = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'hooksdream-app' });

let userA;
let tokenA;

beforeAll(async () => {
  await connectDB();
  userA = await makeUser('a');
  tokenA = tokenFor(userA._id);
}, 120000);

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(
    collections
      .filter((c) => c.collectionName !== 'users')
      .map((c) => c.deleteMany({}))
  );
});

describe('POST /api/posts - auth', () => {
  it('trả 401 khi không có Authorization header', async () => {
    const res = await request(app).post('/api/posts').send({ content: 'hi' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('trả 401 khi token sai', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer token-sai')
      .send({ content: 'hi' });
    expect(res.status).toBe(401);
  });

  it('trả 401 khi user trong token không tồn tại', async () => {
    const ghost = tokenFor('user-ma-khong-ton-tai');
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${ghost}`)
      .send({ content: 'hi' });
    expect(res.status).toBe(401);
  });
});

describe('[BUG-B1] POST /api/posts - payload thật của frontend', () => {
  it('tạo bài text-only (video là chuỗi rỗng) -> 201', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Xin chào', images: [], video: '', visibility: 'public' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: 'Post created successfully' });
    expect(res.body.data.content).toBe('Xin chào');
  });

  it('tạo bài chỉ có ảnh (video là chuỗi rỗng) -> 201', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: '', images: ['https://cdn.example.com/a.jpg'], video: '', visibility: 'public' });

    expect(res.status).toBe(201);
    expect(res.body.data.images).toEqual(['https://cdn.example.com/a.jpg']);
  });
});

describe('POST /api/posts - validation', () => {
  it('body hoàn toàn rỗng -> không 201, message rõ ràng', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({});
    expect(res.status).not.toBe(201);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.message).toBe('string');
  });

  it('content vượt 5000 ký tự -> 400 Validation failed', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'x'.repeat(5001) });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors[0]).toHaveProperty('field');
  });

  it('video là chuỗi không phải URL -> 400', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'a', video: 'khong-phai-url' });
    expect(res.status).toBe(400);
  });
});

describe('CRUD + tương tác qua HTTP', () => {
  let postId;

  beforeEach(async () => {
    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'bài gốc để test' });
    postId = created.body.data._id;
  });

  it('GET /api/posts trả feed có pagination', async () => {
    const res = await request(app).get('/api/posts?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 10 });
  });

  it('GET /api/posts?limit=51 -> 400 (vượt max)', async () => {
    const res = await request(app).get('/api/posts?limit=51');
    expect(res.status).toBe(400);
  });

  it('GET /api/posts/:id trả chi tiết', async () => {
    const res = await request(app).get(`/api/posts/${postId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(postId);
  });

  it('PUT /api/posts/:id cập nhật content', async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'đã sửa' });
    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('đã sửa');
  });

  it('POST /:id/like toggle like -> unlike, likeCount đúng', async () => {
    const like = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(like.status).toBe(200);
    expect(like.body.data).toMatchObject({ isLiked: true, likeCount: 1 });

    const unlike = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(unlike.body.data).toMatchObject({ isLiked: false, likeCount: 0 });
  });

  it('POST /:id/like khi chưa login -> 401', async () => {
    const res = await request(app).post(`/api/posts/${postId}/like`);
    expect(res.status).toBe(401);
  });

  it('POST /:id/like với id không tồn tại -> 404', async () => {
    const res = await request(app)
      .post('/api/posts/000000000000000000000000/like')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Post not found');
  });

  it('[BUG-B3] POST /:id/unlike -> 404 vì route không tồn tại', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/unlike`)
      .set('Authorization', `Bearer ${tokenA}`);
    // Backend chỉ có /:id/like dạng toggle. Test khóa sự thật hiện tại (404)
    // để sau này: hoặc frontend bỏ gọi /unlike, hoặc backend bổ sung route
    // thì test này phải được cập nhật theo quyết định fix.
    expect(res.status).toBe(404);
  });

  it('PATCH /:id/archive rồi /:id/restore', async () => {
    const archived = await request(app)
      .patch(`/api/posts/${postId}/archive`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(archived.status).toBe(200);

    const feed = await request(app).get('/api/posts');
    expect(feed.body.data.map((p) => p._id)).not.toContain(postId);

    const restored = await request(app)
      .patch(`/api/posts/${postId}/restore`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(restored.status).toBe(200);
  });

  it('DELETE /api/posts/:id xoá bài', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(await Post.findById(postId)).toBeNull();
  });

  it('GET /api/posts/user/:userId trả bài của user', async () => {
    const res = await request(app).get(`/api/posts/user/${userA._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/posts/search?q= trả kết quả', async () => {
    const res = await request(app).get('/api/posts/search?q=gốc');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/posts/trending trả 200', async () => {
    const res = await request(app).get('/api/posts/trending');
    expect(res.status).toBe(200);
  });
});

describe('repost qua HTTP', () => {
  it('không cho repost chính bài của mình -> 400', async () => {
    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'bài của tôi' });

    const res = await request(app)
      .post(`/api/posts/${created.body.data._id}/repost`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cannot repost your own post');
  });

  it('repost bài của người khác -> 201 và tăng repostCount', async () => {
    const userB = await makeUser('b');
    const tokenB = tokenFor(userB._id);
    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'bài của B' });

    const res = await request(app)
      .post(`/api/posts/${created.body.data._id}/repost`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'chia sẻ lại' });
    expect(res.status).toBe(201);

    const original = await Post.findById(created.body.data._id);
    expect(original.repostCount).toBe(1);
  });

  it('repost 2 lần -> 400 ở lần hai', async () => {
    const userB = await makeUser('c');
    const tokenB = tokenFor(userB._id);
    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'bài của C' });
    const id = created.body.data._id;

    await request(app).post(`/api/posts/${id}/repost`).set('Authorization', `Bearer ${tokenA}`).send({});
    const second = await request(app)
      .post(`/api/posts/${id}/repost`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({});
    expect(second.status).toBe(400);
  });
});

