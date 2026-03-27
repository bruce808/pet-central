import { type ReactNode } from 'react';

export interface TopNavProps {
  logo: ReactNode;
  children?: ReactNode;
  rightSlot?: ReactNode;
}

export function TopNav({ logo, children, rightSlot }: TopNavProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-8">
        <div className="flex-shrink-0">{logo}</div>
        {children && <nav className="hidden items-center gap-1 md:flex">{children}</nav>}
      </div>
      {rightSlot && <div className="flex items-center gap-4">{rightSlot}</div>}
    </header>
  );
}
