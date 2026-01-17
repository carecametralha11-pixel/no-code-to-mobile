import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export function AppLayout({ children, showHeader = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom safe-left safe-right">
      {children}
    </div>
  );
}
