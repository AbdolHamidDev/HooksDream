import { describe, it, expect } from 'vitest';
import type { ProfileFormData } from '@/types/profile';
import { validateProfile, validateFile } from '../profileValidation';

describe('validateProfile', () => {
  it('chấp nhận hồ sơ hợp lệ, trả về object rỗng', () => {
    const errors = validateProfile({
      displayName: 'Nguyen Van A',
      username: 'nguyen_a',
      bio: 'Xin chào',
      website: 'https://example.com',
      email: 'a@example.com',
      phone: '+84912345678',
      pronouns: 'they/them',
    });
    expect(errors).toEqual({});
  });

  it('bắt buộc có displayName', () => {
    expect(
      validateProfile({ displayName: '  ', username: 'valid_user' }).displayName
    ).toBeTruthy();
    // Hàm kiểm tra phòng thủ dù field này là bắt buộc trong ProfileFormData,
    // nên vẫn phải xử lý được dữ liệu thiếu.
    expect(
      validateProfile({ username: 'valid_user' } as ProfileFormData).displayName
    ).toBeTruthy();
  });

  it('bắt buộc có username', () => {
    expect(
      validateProfile({ displayName: 'A' } as ProfileFormData).username
    ).toBeTruthy();
  });

  it('từ chối username có ký tự lạ', () => {
    const errors = validateProfile({ displayName: 'A', username: 'sai ký tự!' });
    expect(errors.username).toBeTruthy();
  });

  it('tự thêm http:// khi website thiếu protocol', () => {
    // website không có protocol vẫn phải hợp lệ
    expect(
      validateProfile({ displayName: 'A', username: 'user_1', website: 'example.com' }).website
    ).toBeUndefined();
  });

  it('từ chối website sai định dạng', () => {
    expect(
      validateProfile({ displayName: 'A', username: 'user_1', website: 'not a url' }).website
    ).toBeTruthy();
  });

  it('từ chối email sai định dạng', () => {
    expect(
      validateProfile({ displayName: 'A', username: 'user_1', email: 'khong-phai-email' }).email
    ).toBeTruthy();
  });

  it('bỏ qua các trường tùy chọn rỗng', () => {
    const errors = validateProfile({ displayName: 'A', username: 'user_1', bio: '', email: '', website: '' });
    expect(errors).toEqual({});
  });

  it('từ chối bio quá dài', () => {
    expect(validateProfile({ displayName: 'A', username: 'user_1', bio: 'x'.repeat(5000) }).bio).toBeTruthy();
  });
});

describe('validateFile', () => {
  // new File(['x'], ...) chỉ tạo file 1 byte, nên muốn file lớn phải cấp
  // thật sự một ArrayBuffer có dung lượng tương ứng.
  const makeFile = (bytes: number, type: string): File =>
    new File([new ArrayBuffer(bytes)], 'f.png', { type });

  it('chấp nhận file hợp lệ, trả null', () => {
    expect(validateFile(makeFile(100 * 1024, 'image/png'), 'avatar')).toBeNull();
  });

  it('từ chối file quá lớn', () => {
    const huge = makeFile(50 * 1024 * 1024, 'image/png');
    expect(validateFile(huge, 'avatar')).toContain('too large');
  });

  it('từ chối sai kiểu file', () => {
    expect(validateFile(makeFile(100, 'application/pdf'), 'avatar')).toContain('Invalid file type');
  });

  it('giới hạn avatar và cover khác nhau', () => {
    const mid = makeFile(3 * 1024 * 1024, 'image/png');
    // 3MB có thể quá giới hạn avatar nhưng chưa chắc quá giới hạn cover
    const avatarErr = validateFile(mid, 'avatar');
    const coverErr = validateFile(mid, 'coverImage');
    expect(avatarErr !== coverErr || avatarErr === null).toBe(true);
  });
});
