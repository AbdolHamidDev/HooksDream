import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { cn, generateId, isValidHandle, isValidContent, debounce } from '../helpers';

describe('cn', () => {
  it('gộp class thường', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('class tailwind xung đột thì giữ class cuối', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm text-red-500', 'text-blue-500')).toBe('text-sm text-blue-500');
  });

  it('bỏ qua falsy', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});

describe('generateId', () => {
  it('trả chuỗi ngắn và không rỗng', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('sinh ra giá trị khác nhau', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('isValidHandle', () => {
  it('chấp nhận handle hợp lệ', () => {
    expect(isValidHandle('nguyen')).toBe(true);
    expect(isValidHandle('a.b_c1')).toBe(true);
  });

  it('từ chối handle quá ngắn hoặc quá dài', () => {
    expect(isValidHandle('ab')).toBe(false);
    expect(isValidHandle('a'.repeat(32))).toBe(false);
  });

  it('từ chối chữ hoa và ký tự lạ', () => {
    expect(isValidHandle('Nguyen')).toBe(false);
    expect(isValidHandle('a b')).toBe(false);
  });
});

describe('isValidContent', () => {
  it('từ chối nội dung rỗng hoặc chỉ khoảng trắng', () => {
    expect(isValidContent('')).toBe(false);
    expect(isValidContent('   \n  ')).toBe(false);
  });

  it('chấp nhận nội dung hợp lệ', () => {
    expect(isValidContent('hello')).toBe(true);
  });

  it('từ chối nội dung quá 5000 ký tự', () => {
    expect(isValidContent('x'.repeat(5001))).toBe(false);
    expect(isValidContent('x'.repeat(5000))).toBe(true);
  });
});

describe('debounce', () => {
  it('chỉ gọi hàm sau khi ngừng gọi trong khoảng wait', async () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce(spy, 300);

    debounced();
    debounced();
    debounced();
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(spy).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

// Component nhỏ để xác nhận @testing-library/react hoạt động với React 19
// (ref as prop, event handler). Không test component thật của dự án vì chúng
// phụ thuộc nhiều context/store.
function Counter() {
  const [n, setN] = useState(0);
  return (
    <div>
      <span data-testid="count">{n}</span>
      <button onClick={() => setN((v) => v + 1)}>tăng</button>
    </div>
  );
}

describe('render + tương tác (React 19)', () => {
  it('render giá trị ban đầu', () => {
    render(<Counter />);
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('cập nhật state khi bấm nút', async () => {
    const user = userEvent.setup();
    render(<Counter />);
    await user.click(screen.getByRole('button', { name: 'tăng' }));
    await user.click(screen.getByRole('button', { name: 'tăng' }));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
  });
});
