// Thiết lập dùng chung cho test frontend.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Dọn DOM sau mỗi test để không rò rỉ giữa các case.
afterEach(() => {
  cleanup();
});

// jsdom không có matchMedia; nhiều hook/component (useIsMobile, next-themes,
// framer-motion...) gọi nó lúc khởi tạo.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// jsdom thiếu IntersectionObserver (virtual list, lazy image...).
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});
Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// jsdom thiếu ResizeObserver.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});
Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// jsdom chưa implement scrollTo.
window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
