// Test hồi quy cho bug "post không hoạt động" (B1):
// frontend useCreatePost luôn gửi `video: ''` khi không có video,
// nhưng createPostSchema dùng z.string().url() nên reject chuỗi rỗng
// -> POST /api/posts trả 400 cho MỌI bài viết.
// Các test đánh dấu [BUG-B1] đang ĐỎ — sau khi fix (chuẩn hoá '' -> undefined
// ở client + server tolerant) phải XANH mà không đổi kỳ vọng khác.
const { createPostSchema, validateRequest } = require('../../validators/postValidator');

// Payload y hệt frontend gửi khi đăng bài text-only (useCreatePost.handleSubmit).
const frontendTextOnlyPayload = () => ({
  content: 'Xin chào mọi người',
  images: [],
  video: '',
  visibility: 'public',
});

describe('[BUG-B1] createPostSchema với payload thật của frontend', () => {
  it('chấp nhận bài text-only mà frontend gửi (video là chuỗi rỗng)', () => {
    const res = createPostSchema.safeParse(frontendTextOnlyPayload());
    expect(res.success).toBe(true);
  });

  it('chấp nhận bài chỉ có ảnh mà frontend gửi (video là chuỗi rỗng)', () => {
    const res = createPostSchema.safeParse({
      content: '',
      images: ['https://cdn.example.com/a.jpg'],
      video: '',
      visibility: 'public',
    });
    expect(res.success).toBe(true);
  });

  it('validateRequest không trả 400 cho payload text-only của frontend', async () => {
    const req = { body: frontendTextOnlyPayload(), query: {}, params: {} };
    const outcome = await new Promise((resolve) => {
      const res = {
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          resolve({ status: this.statusCode, body: payload });
        },
      };
      validateRequest(createPostSchema)(req, res, (err) => resolve({ next: err || null }));
    });
    // Middleware phải gọi next() (không có status 400), req.validated được gán.
    expect(outcome.status).toBeUndefined();
    expect(outcome.next).toBeNull();
    expect(req.validated.content).toBe('Xin chào mọi người');
  });

  it('chuẩn hoá video rỗng thành undefined (không lưu chuỗi rác vào DB)', async () => {
    const req = { body: frontendTextOnlyPayload(), query: {}, params: {} };
    let nextCalled = false;
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        throw new Error(`Không được trả lỗi, nhưng nhận status=${this.statusCode} body=${JSON.stringify(payload)}`);
      },
    };
    validateRequest(createPostSchema)(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
    expect(req.validated.video).toBeUndefined();
  });
});

describe('createPostSchema - hành vi đúng phải giữ nguyên sau fix', () => {
  it('chấp nhận video là URL hợp lệ', () => {
    const res = createPostSchema.safeParse({
      content: 'xem video này',
      video: 'https://cdn.example.com/v.mp4',
    });
    expect(res.success).toBe(true);
  });

  it('vẫn từ chối video là chuỗi không phải URL', () => {
    expect(createPostSchema.safeParse({ content: 'a', video: 'khong-phai-url' }).success).toBe(false);
  });

  it('vẫn từ chối nội dung vượt quá 5000 ký tự', () => {
    expect(createPostSchema.safeParse({ content: 'x'.repeat(5001) }).success).toBe(false);
  });
});
