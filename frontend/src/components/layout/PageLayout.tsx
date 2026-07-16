// components/layout/PageLayout.tsx - Simplified layout wrapper
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import SidebarLeft from './SidebarLeft';
import { SidebarRight } from './SidebarRight';
import { TooltipProvider } from '@radix-ui/react-tooltip';

interface PageLayoutProps {
  children: React.ReactNode;
  showSidebars?: boolean;
  showMobileHeader?: boolean;
  showBottomNav?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  showSidebars = true,
  showMobileHeader = false,
  showBottomNav = true,
  fullWidth = false,
  className = ''
}) => {
  const location = useLocation();
  
  // Determine if we're on mobile
  const isMobile = window.innerWidth < 1024;

  return (
    <div className={`min-h-screen bg-background text-foreground transition-colors duration-200 ${className}`}>
      {/* Desktop Header */}
      {!isMobile && <Header />}
      
      {/* Mobile Header */}
      {isMobile && showMobileHeader && <MobileHeader />}
      
      {/* Mobile Bottom Navigation */}
      {isMobile && showBottomNav && <BottomNav />}

      <main className={`
        w-full 
        ${showMobileHeader ? 'pt-16' : ''} 
        ${fullWidth ? 'px-0 py-0' : 'px-0 py-6'}
      `}>
        {fullWidth ? (
          // Full width layout (for stories, edit profile, etc.)
          <div className="w-full">
            {children}
          </div>
        ) : showSidebars && !isMobile ? (
          // Standard layout with sidebars (desktop only)
          <div className="w-full lg:grid lg:grid-cols-12 lg:gap-6 lg:px-8">
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                <SidebarLeft />
              </div>
            </aside>

            <section className="w-full lg:col-span-6">
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </section>

            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                <SidebarRight />
              </div>
            </aside>
          </div>
        ) : (
          // Simple layout without sidebars
          <div className="w-full">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};