import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatNumber, shortenAddress } from '../formatters';

const NOW = new Date('2026-10-05T12:00:00Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

// Lưu ý: file này có formatTimeAgo riêng (tiếng Việt) khác với bản trong
// timeAgo.ts (tiếng Anh). Cả hai đang tồn tại song song trong codebase —
// xem README của thư mục này.
describe('formatNumber', () => {
  it('giữ nguyên số nhỏ', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(7)).toBe('7');
    expect(formatNumber(999)).toBe('999');
  });

  it('rút gọn nghìn', () => {
    expect(formatNumber(1000)).toBe('1.0K');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(999999)).toBe('1000.0K');
  });

  it('rút gọn triệu', () => {
    expect(formatNumber(1000000)).toBe('1.0M');
    expect(formatNumber(2500000)).toBe('2.5M');
  });
});

describe('shortenAddress', () => {
  it('rút gọn giữa chuỗi', () => {
    // chars=4 -> lấy (chars+2)=6 ký tự đầu và 4 ký tự cuối
    expect(shortenAddress('0x1234567890abcdef', 4)).toBe('0x1234...cdef');
  });

  it('trả chuỗi rỗng khi đầu vào rỗng', () => {
    expect(shortenAddress('')).toBe('');
  });

  it('tôn trọng tham số chars', () => {
    expect(shortenAddress('abcdefghij', 2)).toBe('abcd...ij');
  });
});

describe('formatTimeAgo (bản tiếng Việt trong formatters.ts)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('định dạng theo phút/giờ/ngày/tháng', async () => {
    const { formatTimeAgo } = await import('../formatters');
    expect(formatTimeAgo(ago(30 * 1000))).toBe('vừa xong');
    expect(formatTimeAgo(ago(5 * 60 * 1000))).toBe('5 phút');
    expect(formatTimeAgo(ago(3 * 60 * 60 * 1000))).toBe('3 giờ');
    expect(formatTimeAgo(ago(2 * 24 * 60 * 60 * 1000))).toBe('2 ngày');
    expect(formatTimeAgo(ago(60 * 24 * 60 * 60 * 1000))).toBe('2 tháng');
  });
});
