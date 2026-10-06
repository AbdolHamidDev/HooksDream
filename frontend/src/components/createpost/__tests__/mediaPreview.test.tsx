// Test UI cho MediaPreview + ContentInput (pure props).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaPreview } from '../MediaPreview';
import { ContentInput } from '../ContentInput';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'vi' },
  }),
}));

const fileNamed = (name: string, type: string, size = 100) =>
  new File([new ArrayBuffer(size)], name, { type });

beforeEach(() => {
  vi.clearAllMocks();
  if (!URL.createObjectURL) {
    (URL as unknown as { createObjectURL: () => string }).createObjectURL = vi.fn(() => 'blob:mock');
  }
});

describe('MediaPreview', () => {
  const base = {
    maxImages: 4,
    removeImage: vi.fn(),
    clearAllImages: vi.fn(),
    removeVideo: vi.fn(),
  };

  it('không render gì khi chưa có media', () => {
    const { container } = render(<MediaPreview {...base} images={[]} video={null} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('video')).toBeNull();
  });

  it('render grid ảnh + nút xóa tất cả', async () => {
    const user = userEvent.setup();
    const clearAllImages = vi.fn();
    render(
      <MediaPreview
        {...base}
        images={[fileNamed('a.png', 'image/png'), fileNamed('b.png', 'image/png')]}
        video={null}
        clearAllImages={clearAllImages}
      />
    );
    expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
    expect(screen.getByAltText('Preview 2')).toBeInTheDocument();
    await user.click(screen.getByText('Xóa tất cả'));
    expect(clearAllImages).toHaveBeenCalledTimes(1);
  });

  it('render video preview + nút gỡ video', async () => {
    const user = userEvent.setup();
    const removeVideo = vi.fn();
    const { container } = render(
      <MediaPreview {...base} images={[]} video={fileNamed('v.mp4', 'video/mp4')} removeVideo={removeVideo} />
    );
    expect(container.querySelector('video')).not.toBeNull();
    const removeBtn = container.querySelector('video')!.parentElement!.querySelector('button')!;
    await user.click(removeBtn);
    expect(removeVideo).toHaveBeenCalledTimes(1);
  });
});

describe('ContentInput', () => {
  const base = {
    content: '',
    setContent: vi.fn(),
    isTextExpanded: false,
    setIsTextExpanded: vi.fn(),
    isSubmitting: false,
    adjustTextareaHeight: vi.fn(),
  };

  it('hiển thị đếm ký tự và nút mở rộng khi > 100 ký tự', async () => {
    const user = userEvent.setup();
    const setIsTextExpanded = vi.fn();
    render(<ContentInput {...base} content={'x'.repeat(150)} setIsTextExpanded={setIsTextExpanded} />);
    expect(screen.getByText('150/5000')).toBeInTheDocument();
    await user.click(screen.getByText('Mở rộng'));
    expect(setIsTextExpanded).toHaveBeenCalledWith(true);
  });

  it('không hiện nút mở rộng khi content ngắn', () => {
    render(<ContentInput {...base} content={'ngắn'} />);
    expect(screen.queryByText('Mở rộng')).toBeNull();
  });

  it('cảnh báo số ký tự còn lại khi > 4500', () => {
    render(<ContentInput {...base} content={'x'.repeat(4950)} />);
    expect(screen.getByText(/ký tự còn lại/)).toBeInTheDocument();
  });
});
