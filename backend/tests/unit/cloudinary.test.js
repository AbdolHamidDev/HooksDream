// vitest.config.js bật `globals: true` nên describe/it/expect/vi có sẵn.
// File này dùng CommonJS require để khớp với backend (`"type": "commonjs"`).

// utils/cloudinary.js là CJS và dùng `require('cloudinary').v2`.
// `vi.mock()` chỉ chặn được import ESM, nên ta thay thế module trong require.cache
// TRƯỚC khi require utils/cloudinary — nhờ vậy không có call API thật nào chạy.
const destroyMock = vi.fn().mockResolvedValue({ result: 'ok' });
const pingMock = vi.fn().mockResolvedValue({ status: 'ok' });

const cloudinaryMock = {
  config: vi.fn(),
  uploader: { destroy: destroyMock, upload_stream: vi.fn() },
  api: { ping: pingMock },
};

const cloudinaryPath = require.resolve('cloudinary');
require.cache[cloudinaryPath] = {
  id: cloudinaryPath,
  filename: cloudinaryPath,
  loaded: true,
  exports: { v2: cloudinaryMock, default: cloudinaryMock },
  children: [],
  paths: [],
};

const { deleteImageFromCloudinary } = require('../../utils/cloudinary');

describe('deleteImageFromCloudinary — trích xuất public_id', () => {
  beforeEach(() => {
    destroyMock.mockClear();
    destroyMock.mockResolvedValue({ result: 'ok' });
  });

  it('bỏ qua URL không phải Cloudinary', async () => {
    const res = await deleteImageFromCloudinary('https://example.com/img.jpg');
    expect(res).toEqual({ result: 'skipped', message: 'Not a Cloudinary URL' });
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('bỏ qua khi không có URL', async () => {
    await expect(deleteImageFromCloudinary(null)).resolves.toMatchObject({ result: 'skipped' });
    await expect(deleteImageFromCloudinary(undefined)).resolves.toMatchObject({ result: 'skipped' });
    await expect(deleteImageFromCloudinary('')).resolves.toMatchObject({ result: 'skipped' });
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('báo lỗi khi URL không có đoạn "upload"', async () => {
    const res = await deleteImageFromCloudinary('https://res.cloudinary.com/demo/image/fetch/abc.jpg');
    expect(res).toMatchObject({ result: 'error', message: 'Invalid Cloudinary URL format' });
  });

  it('lấy public_id cơ bản, bỏ đuôi file', async () => {
    await deleteImageFromCloudinary(
      'https://res.cloudinary.com/demo/image/upload/1700000000-abc123.jpg'
    );
    expect(destroyMock).toHaveBeenCalledWith('1700000000-abc123', expect.objectContaining({
      resource_type: 'image',
    }));
  });

  it('bỏ version dạng v<timestamp>/', async () => {
    await deleteImageFromCloudinary(
      'https://res.cloudinary.com/demo/image/upload/v1700000000/1700000000-abc123.jpg'
    );
    expect(destroyMock).toHaveBeenCalledWith('1700000000-abc123', expect.anything());
  });

  it('giữ nguyên tên bắt đầu bằng chữ v nếu không phải version', async () => {
    // "video.mp4" bắt đầu bằng 'v' nhưng KHÔNG phải version -> phải giữ nguyên.
    await deleteImageFromCloudinary('https://res.cloudinary.com/demo/video/upload/video.mp4');
    expect(destroyMock).toHaveBeenCalledWith('video', expect.anything());
  });

  it('giữ đường dẫn thư mục lồng nhau', async () => {
    await deleteImageFromCloudinary(
      'https://res.cloudinary.com/demo/image/upload/uploads/images/2024/pic.png'
    );
    expect(destroyMock).toHaveBeenCalledWith('uploads/images/2024/pic', expect.anything());
  });

  it('trả về lỗi khi Cloudinary từ chối', async () => {
    destroyMock.mockResolvedValue({ result: 'not found' });
    const res = await deleteImageFromCloudinary(
      'https://res.cloudinary.com/demo/image/upload/missing.jpg'
    );
    expect(res.result).toBe('not found');
  });

  it('bắt lỗi exception và không làm vỡ ứng dụng', async () => {
    destroyMock.mockRejectedValue(new Error('Network down'));
    const res = await deleteImageFromCloudinary(
      'https://res.cloudinary.com/demo/image/upload/x.jpg'
    );
    expect(res).toMatchObject({ result: 'error', error: 'Network down' });
  });
});

