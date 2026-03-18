import { useState } from 'react';
import type { ReactNode } from 'react';
import { Play } from 'lucide-react';
import { SideNav } from './SideNav';
import './AppLayout.css';

interface AppLayoutProps {
  children: ReactNode;
  activePage?: string;
  onNavigate?: (page: string) => void;
  onStartChat?: () => void;
}

export function AppLayout({ children, activePage, onNavigate, onStartChat }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <aside className={`nav-area ${collapsed ? 'collapsed' : ''}`}>
        <SideNav
          activePage={activePage}
          onNavigate={onNavigate}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>
      <main className="main-content">
        {children}
      </main>
      {onStartChat && (
        <button className="fab-start-chat" onClick={onStartChat} title="Start Chat">
          <Play size={18} />
        </button>
      )}
    </div>
  );
}
