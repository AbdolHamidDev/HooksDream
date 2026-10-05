// Test cho Zod schemas và middleware validateRequest.
// globals (describe/it/expect) đã bật trong vitest.config.js
const {
  createPostSchema,
  updatePostSchema,
  getPostsQuerySchema,
  searchPostsQuerySchema,
  validateRequest,
} = require('../../validators/postValidator');

describe('createPostSchema', () => {
  it('chấp nhận bài viết chỉ có nội dung', () => {
    const res = createPostSchema.safeParse({ content: 'Xin chào' });
    expect(res.success).toBe(true);
  });

  it('mặc định visibility là public', () => {
    const res = createPostSchema.parse({ content: 'abc' });
    expect(res.visibility).toBe('public');
  });

  it('từ chối visibility ngoài danh sách cho phép', () => {
    expect(createPostSchema.safeParse({ content: 'a', visibility: 'banana' }).success).toBe(false);
  });

  it('từ chối nội dung vượt quá 5000 ký tự', () => {
    expect(createPostSchema.safeParse({ content: 'x'.repeat(5001) }).success).toBe(false);
  });

  it('từ chối ảnh không phải URL hợp lệ', () => {
    expect(createPostSchema.safeParse({ images: ['khong-phai-url'] }).success).toBe(false);
  });

  it('từ chối hơn 10 ảnh', () => {
    const images = Array.from({ length: 11 }, (_, i) => `https://cdn.example.com/${i}.jpg`);
    expect(createPostSchema.safeParse({ images }).success).toBe(false);
  });

  it('cho phép bài viết không có nội dung (chỉ video)', () => {
    const res = createPostSchema.safeParse({ video: 'https://cdn.example.com/v.mp4' });
    expect(res.success).toBe(true);
  });
});

describe('getPostsQuerySchema', () => {
  it('ép kiểu chuỗi query sang số', () => {
    const res = getPostsQuerySchema.parse({ page: '3', limit: '20' });
    expect(res.page).toBe(3);
    expect(res.limit).toBe(20);
  });

  it('áp dụng giá trị mặc định khi không truyền', () => {
    const res = getPostsQuerySchema.parse({});
    expect(res).toMatchObject({ page: 1, limit: 10, sort: 'latest' });
  });

  it('từ chối limit vượt quá 50', () => {
    expect(getPostsQuerySchema.safeParse({ limit: '51' }).success).toBe(false);
  });

  it('từ chối page không phải số dương', () => {
    expect(getPostsQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(getPostsQuerySchema.safeParse({ page: '-1' }).success).toBe(false);
    expect(getPostsQuerySchema.safeParse({ page: 'abc' }).success).toBe(false);
  });

  it('từ chối sort không hợp lệ', () => {
    expect(getPostsQuerySchema.safeParse({ sort: 'random' }).success).toBe(false);
  });
});

describe('searchPostsQuerySchema', () => {
  it('mặc định sort là relevance', () => {
    expect(searchPostsQuerySchema.parse({}).sort).toBe('relevance');
  });

  it('từ chối từ khoá quá 200 ký tự', () => {
    expect(searchPostsQuerySchema.safeParse({ q: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('updatePostSchema', () => {
  it('cho phép cập nhật một phần', () => {
    expect(updatePostSchema.safeParse({ content: 'sửa lại' }).success).toBe(true);
  });

  it('không áp dụng default cho visibility khi cập nhật', () => {
    const res = updatePostSchema.parse({ content: 'abc' });
    expect(res.visibility).toBeUndefined();
  });
});

describe('validateRequest middleware', () => {
  const run = (schema, req) =>
    new Promise((resolve) => {
      const res = {
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          resolve({ status: this.statusCode, body: payload });
        },
      };
      const next = (err) => resolve({ next: err || null });
      validateRequest(schema)(req, res, next);
    });

  it('gán dữ liệu đã chuẩn hoá vào req.validated', async () => {
    const req = { body: { content: 'ok' }, query: {}, params: {} };
    const out = await run(createPostSchema, req);
    expect(out.next).toBeNull();
    expect(req.validated.visibility).toBe('public');
  });

  it('trả 400 với danh sách lỗi khi dữ liệu sai', async () => {
    const req = { body: { content: 'x'.repeat(6000) }, query: {}, params: {} };
    const out = await run(createPostSchema, req);
    expect(out.status).toBe(400);
    expect(out.body.success).toBe(false);
    expect(out.body.errors[0]).toHaveProperty('field');
    expect(out.body.errors[0]).toHaveProperty('message');
  });
});
