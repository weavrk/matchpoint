import { useState } from 'react';
import type { ReactNode } from 'react';
import { SideNav, MobileBottomNav } from './SideNav';
import './AppLayout.css';
import './SideNav.css';

interface AppLayoutProps {
  children: ReactNode;
  activePage?: string;
  onNavigate?: (page: string) => void;
  userName?: string;
}

export function AppLayout({ children, activePage, onNavigate, userName }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="app-layout">
      <aside className={`nav-area ${collapsed ? 'collapsed' : ''}`}>
        <SideNav
          activePage={activePage}
          onNavigate={onNavigate}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          userName={userName}
        />
      </aside>
      <main className="main-content">
        {children}
      </main>
      <MobileBottomNav activePage={activePage} onNavigate={onNavigate} />
    </div>
  );
}
