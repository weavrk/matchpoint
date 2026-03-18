import { ReactNode } from 'react';
import { SideNav } from './SideNav';
import './AppLayout.css';

interface AppLayoutProps {
  children: ReactNode;
  activePage?: string;
  onNavigate?: (page: string) => void;
}

export function AppLayout({ children, activePage, onNavigate }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <aside className="nav-area">
        <SideNav activePage={activePage} onNavigate={onNavigate} />
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
