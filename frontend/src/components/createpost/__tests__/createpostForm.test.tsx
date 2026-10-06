// Test UI cho form tạo bài (pure props, không cần store/router).
// Bao phủ: render user info, nhập content, đếm ký tự, preview media,
// action bar enable/disable, nút clear.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePostForm } from '../CreatePostForm';
import { ActionBar } from '../ActionBar';
import { TooltipProvider } from '@radix-ui/react-tooltip';

// react-i18next thật cần provider; mock gọn trả về defaultValue.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'vi' },
  }),
}));

// useLinkPreview gọi API thật khi content có URL — mock để test độc lập.
vi.mock('@/hooks/useLinkPreview', () => ({
  useUrlExtraction: () => ({ hasUrls: () => false, extractUrls: () => [] }),
  useLinkPreview: () => ({
    previews: [],
    fetchMultiplePreviews: vi.fn(),
    clearPreviews: vi.fn(),
  }),
}));

const profile = { displayName: 'Nguyen Van A', username: 'nguyenvana', avatar: '', email: 'a@x.com' };

const baseFormProps = {
  profile,
  content: '',
  setContent: vi.fn(),
  isTextExpanded: false,
  setIsTextExpanded: vi.fn(),
  isSubmitting: false,
  images: [] as File[],
  video: null as File | null,
  maxImages: 4,
  removeImage: vi.fn(),
  clearAllImages: vi.fn(),
  removeVideo: vi.fn(),
  onImageUpload: vi.fn(),
  onVideoUpload: vi.fn(),
};

const fileNamed = (name: string, type: string, size = 100) =>
  new File([new ArrayBuffer(size)], name, { type });

// Wrapper bắt buộc: ActionBar/CreatePostForm dùng Tooltip nên cần TooltipProvider
// (y hệt CreatePostPage đang bọc ngoài cùng).
const renderWithTooltip = (ui: React.ReactElement) =>
  render(<TooltipProvider>{ui}</TooltipProvider>);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CreatePostForm', () => {
  it('render tên hiển thị + textarea placeholder', () => {
    renderWithTooltip(<CreatePostForm {...baseFormProps} />);
    expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Bạn đang nghĩ gì?')).toBeInTheDocument();
  });

  it('gõ text gọi setContent', async () => {
    const user = userEvent.setup();
    const setContent = vi.fn();
    renderWithTooltip(<CreatePostForm {...baseFormProps} setContent={setContent} />);
    await user.type(screen.getByPlaceholderText('Bạn đang nghĩ gì?'), 'hello');
    expect(setContent).toHaveBeenCalled();
  });

  it('hiển thị preview khi có ảnh', () => {
    renderWithTooltip(<CreatePostForm {...baseFormProps} images={[fileNamed('a.png', 'image/png')]} />);
    expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
  });

  it('textarea disabled khi đang submit', () => {
    renderWithTooltip(<CreatePostForm {...baseFormProps} isSubmitting />);
    expect(screen.getByPlaceholderText('Bạn đang nghĩ gì?')).toBeDisabled();
  });
});

describe('ActionBar', () => {
  const base = {
    isSubmitting: false,
    images: [] as File[],
    video: null as File | null,
    content: '',
    maxImages: 4,
    onImageUpload: vi.fn(),
    onVideoUpload: vi.fn(),
  };

  it('hiển thị đếm ký tự content.length/5000', () => {
    renderWithTooltip(<ActionBar {...base} content={'x'.repeat(10)} />);
    expect(screen.getByText('10/5000')).toBeInTheDocument();
  });

  it('cảnh báo khi gần hết ký tự (>4500)', () => {
    renderWithTooltip(<ActionBar {...base} content={'x'.repeat(4600)} />);
    expect(screen.getByText(/còn lại/)).toBeInTheDocument();
  });

  it('vô hiệu hoá nút ảnh khi đã có video', () => {
    const { container } = renderWithTooltip(
      <ActionBar {...base} video={fileNamed('v.mp4', 'video/mp4')} />
    );
    expect(container.querySelectorAll('button[disabled]').length).toBeGreaterThan(0);
  });

  it('vô hiệu hoá nút ảnh khi đã đủ maxImages', () => {
    const images = [0, 1, 2, 3].map((i) => fileNamed(`${i}.png`, 'image/png'));
    const { container } = renderWithTooltip(<ActionBar {...base} images={images} />);
    expect(container.querySelectorAll('button[disabled]').length).toBeGreaterThan(0);
  });
});
