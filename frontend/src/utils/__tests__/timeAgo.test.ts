import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import {
  formatTimeAgo,
  formatStoryTimeRemaining,
  formatReplyTimeAgo,
} from '../timeAgo';

const NOW = new Date('2026-10-05T12:00:00Z');

const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

afterEach(() => {
  vi.useRealTimers();
});

const freeze = () => vi.useFakeTimers({ now: NOW });

describe('formatTimeAgo', () => {
  beforeEach(freeze);

  it('trả "just now" cho < 1 phút', () => {
    expect(formatTimeAgo(ago(0))).toBe('just now');
    expect(formatTimeAgo(ago(30 * 1000))).toBe('just now');
    expect(formatTimeAgo(ago(59 * 1000))).toBe('just now');
  });

  it('chuyển sang phút ở mốc 60 giây', () => {
    expect(formatTimeAgo(ago(60 * 1000))).toBe('1m ago');
    expect(formatTimeAgo(ago(59 * 60 * 1000))).toBe('59m ago');
  });

  it('chuyển sang giờ ở mốc 60 phút', () => {
    expect(formatTimeAgo(ago(60 * 60 * 1000))).toBe('1h ago');
    expect(formatTimeAgo(ago(23 * 60 * 60 * 1000))).toBe('23h ago');
  });

  it('chuyển sang ngày ở mốc 24 giờ', () => {
    expect(formatTimeAgo(ago(24 * 60 * 60 * 1000))).toBe('1d ago');
    expect(formatTimeAgo(ago(6 * 24 * 60 * 60 * 1000))).toBe('6d ago');
  });

  it('chuyển sang tuần ở mốc 7 ngày', () => {
    expect(formatTimeAgo(ago(7 * 24 * 60 * 60 * 1000))).toBe('1w ago');
    expect(formatTimeAgo(ago(27 * 24 * 60 * 60 * 1000))).toBe('3w ago');
  });

  it('trả về ngày dạng locale khi trên 4 tuần', () => {
    const old = ago(30 * 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(old)).toBe(new Date(old).toLocaleDateString());
  });

  it('nhận cả Date lẫn string', () => {
    const d = ago(5 * 60 * 1000);
    expect(formatTimeAgo(new Date(d))).toBe(formatTimeAgo(d));
  });
});

describe('formatStoryTimeRemaining', () => {
  beforeEach(freeze);

  it('trả "expired" khi quá 24 giờ', () => {
    expect(formatStoryTimeRemaining(ago(25 * 60 * 60 * 1000))).toBe('expired');
    expect(formatStoryTimeRemaining(ago(24 * 60 * 60 * 1000))).toBe('expired');
  });

  it('hiển thị phút khi còn dưới 1 giờ', () => {
    expect(formatStoryTimeRemaining(ago(23.5 * 60 * 60 * 1000))).toBe('30m left');
  });

  it('hiển thị giờ khi còn trên 1 giờ', () => {
    expect(formatStoryTimeRemaining(ago(2 * 60 * 60 * 1000))).toBe('22h left');
    expect(formatStoryTimeRemaining(ago(0))).toBe('24h left');
  });
});

describe('formatReplyTimeAgo', () => {
  beforeEach(freeze);

  it('trả "now" cho < 1 phút', () => {
    expect(formatReplyTimeAgo(ago(10 * 1000))).toBe('now');
  });

  it('không kèm chữ "ago" ở các mốc khác', () => {
    expect(formatReplyTimeAgo(ago(5 * 60 * 1000))).toBe('5m');
    expect(formatReplyTimeAgo(ago(3 * 60 * 60 * 1000))).toBe('3h');
    expect(formatReplyTimeAgo(ago(2 * 24 * 60 * 60 * 1000))).toBe('2d');
  });

  it('không có nhánh "tuần" — ngày lớn vẫn hiện dạng ngày', () => {
    expect(formatReplyTimeAgo(ago(30 * 24 * 60 * 60 * 1000))).toBe('30d');
  });
});
