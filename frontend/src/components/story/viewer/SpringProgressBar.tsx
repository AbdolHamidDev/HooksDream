// SpringProgressBar.tsx - React Spring for buttery smooth continuous progress
import React from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { Story } from '@/types/story';
import { StoryProgressBarProps } from './types';

// Mỗi thanh progress phải là một component riêng. Nếu gọi useSpring() ngay
// trong vòng stories.map() thì component cha sẽ gọi N hook (N = số story) và
// số lượng đó thay đổi theo props -> vi phạm Rules of Hooks, React có thể
// gán nhầm state giữa các thanh hoặc báo lỗi "Rendered more hooks than expected".
const ProgressSegment: React.FC<{
  isActive: boolean;
  isCompleted: boolean;
  isPending: boolean;
  targetWidth: number;
}> = ({ isActive, isCompleted, isPending, targetWidth }) => {
  // Different spring configs for different states
  const springConfig = isCompleted
    ? { ...config.default, tension: 500, friction: 50 }   // Instant for completed
    : isActive
      ? { tension: 200, friction: 25, precision: 0.001, mass: 1 } // Ultra smooth
      : { ...config.default, tension: 400, friction: 40 }; // Quick for pending

  // React Spring for ultra-smooth continuous animation
  const springProps = useSpring({
    width: `${targetWidth}%`,
    config: springConfig,
    immediate: isPending // Immediate for pending stories
  });

  return (
    <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
      <animated.div
        className="h-full bg-white rounded-full"
        style={{
          ...springProps,
          transform: 'translateZ(0)', // Hardware acceleration
          willChange: isActive ? 'width' : 'auto',
          backfaceVisibility: 'hidden',
          // Additional smoothness optimizations
          WebkitTransform: 'translateZ(0)',
          WebkitBackfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
      />
    </div>
  );
};

export const SpringProgressBar: React.FC<StoryProgressBarProps> = ({
  stories,
  currentIndex,
  progress
}) => {
  return (
    <div className="absolute top-2 left-4 right-4 flex space-x-1 z-20">
      {stories.map((_: Story, index: number) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isPending = index > currentIndex;
        const targetWidth = isCompleted ? 100 : (isActive ? progress : 0);

        return (
          <ProgressSegment
            key={index}
            isActive={isActive}
            isCompleted={isCompleted}
            isPending={isPending}
            targetWidth={targetWidth}
          />
        );
      })}
    </div>
  );
};
