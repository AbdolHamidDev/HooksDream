// Unit test cho postController: mock PostService qua require.cache (CJS),
// kiểm tra mapping req.validated -> service, status code và shape response.
// Không cần DB. Pattern mock theo tests/unit/cloudinary.test.js.
const createPostMock = vi.fn();
const getPostsMock = vi.fn();

const postServicePath = require.resolve('../../services/postService');
require.cache[postServicePath] = {
  id: postServicePath,
  filename: postServicePath,
  loaded: true,
  exports: {
    createPost: createPostMock,
    getPosts: getPostsMock,
  },
  children: [],
  paths: [],
};

const postController = require('../../controllers/postController');

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('postController.createPost', () => {
  it('trả 400 khi thiếu userId', async () => {
    const req = { userId: null, validated: { content: 'a' } };
    const res = mockRes();

    await postController.createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'User ID is required' })
    );
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it('tạo post thành công -> 201 + data', async () => {
    const fakePost = { _id: 'p1', toObject: () => ({ _id: 'p1', content: 'hello' }) };
    createPostMock.mockResolvedValue(fakePost);
    const req = {
      userId: 'user-a',
      validated: { content: 'hello', images: [], video: undefined, visibility: 'public' },
    };
    const res = mockRes();

    await postController.createPost(req, res);

    expect(createPostMock).toHaveBeenCalledWith('user-a', {
      content: 'hello',
      images: [],
      video: undefined,
      visibility: 'public',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Post created successfully' })
    );
  });

  it('service throw -> 500 gọn, không leak stack', async () => {
    createPostMock.mockRejectedValue(new Error('Content, image or video is required'));
    const req = { userId: 'user-a', validated: { content: '   ' } };
    const res = mockRes();

    await postController.createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Internal server error' })
    );
  });
});

describe('postController.getPosts', () => {
  it('gắn isLiked cho từng post khi đã đăng nhập', async () => {
    getPostsMock.mockResolvedValue({
      data: [
        { _id: 'p1', likes: [{ userId: 'user-a' }] },
        { _id: 'p2', likes: [] },
      ],
      pagination: { page: 1 },
    });
    const req = { query: { page: '1' }, userId: 'user-a' };
    const res = mockRes();

    await postController.getPosts(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: [
          expect.objectContaining({ _id: 'p1', isLiked: true }),
          expect.objectContaining({ _id: 'p2', isLiked: false }),
        ],
      })
    );
  });

  it('service throw -> 500', async () => {
    getPostsMock.mockRejectedValue(new Error('db down'));
    const res = mockRes();

    await postController.getPosts({ query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
