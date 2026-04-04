import {
  Home,
  UserPlus,
  Calendar,
  Users,
  Link,
  ChartSpline,
  Store,
  CalendarClock,
  Settings,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import './SideNav.css';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
  itemClassName?: string;
}

function NavItem({ icon, label, active, onClick, collapsed, itemClassName }: NavItemProps) {
  return (
    <a
      className={['nav-item', itemClassName, active ? 'active' : ''].filter(Boolean).join(' ')}
      onClick={onClick}
      href="#"
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </a>
  );
}

interface SideNavProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  userName?: string;
}

export function SideNav({ activePage = 'home', onNavigate, collapsed = false, onToggleCollapse, userName }: SideNavProps) {
  // Derive avatar initial and display name from userName prop
  const displayName = userName || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <nav className={`side-nav ${collapsed ? 'collapsed' : ''}`}>
      <a href="#" className="logo" aria-label="Reflex">
        <img
          src={collapsed ? "/images/logomark.svg" : "/images/wordmark.svg"}
          alt="Reflex"
          className="logo-img"
        />
      </a>

      <div className="side-nav-card">
        <NavItem icon={<Home size={20} />} label="Home" active={activePage === 'home'} onClick={() => onNavigate?.('home')} collapsed={collapsed} />
        <NavItem icon={<UserPlus size={20} />} label="Request Flex" collapsed={collapsed} />
        <NavItem icon={<Calendar size={20} />} label="Calendar" collapsed={collapsed} />
        <NavItem icon={<Users size={20} />} label="Reflexers" collapsed={collapsed} />
        <NavItem icon={<Link size={20} />} label="Talent Connect" active={activePage === 'talent'} onClick={() => onNavigate?.('talent')} collapsed={collapsed} />
        <NavItem icon={<ChartSpline size={20} />} label="Reports" collapsed={collapsed} />
        <NavItem icon={<Store size={20} />} label="Locations" collapsed={collapsed} />
        <NavItem icon={<CalendarClock size={20} />} label="Budgets" collapsed={collapsed} />
        <NavItem icon={<Settings size={20} />} label="Settings" collapsed={collapsed} />
        <NavItem icon={<LifeBuoy size={20} />} label="Support" collapsed={collapsed} />
      </div>

      {!collapsed && (
        <div className="reviews-alert">
          <div className="reviews-alert-header">
            Reviews Needed
          </div>
          <div className="reviews-alert-sub">12 Outstanding</div>
          <div className="reviews-alert-avatars">
            <img className="avatar-img" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" alt="" />
            <img className="avatar-img" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" alt="" />
            <img className="avatar-img" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" alt="" />
            <img className="avatar-img" src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=80&h=80&fit=crop&crop=face" alt="" />
            <span className="reviews-alert-more">+more</span>
          </div>
          <button className="reviews-alert-btn">Leave Reviews</button>
        </div>
      )}

      <div className="nav-footer">
        <div className="user-section">
          {!collapsed ? (
            <>
              <div className="user-row">
                <div className="user-avatar">{avatarInitial}</div>
                <span className="user-name">{displayName}</span>
              </div>
              <div className="logout-row">
                <button className="logout-btn">Log Out</button>
                <button
                  type="button"
                  className="collapse-toggle"
                  onClick={onToggleCollapse}
                  aria-label="Collapse navigation"
                >
                  <ChevronLeft size={20} strokeWidth={2} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="user-avatar">{avatarInitial}</div>
              <div className="expand-row">
                <button
                  type="button"
                  className="collapse-toggle"
                  onClick={onToggleCollapse}
                  aria-label="Expand navigation"
                >
                  <ChevronRight size={20} strokeWidth={2} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

    </nav>
  );
}

interface MobileBottomNavProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
}

export function MobileBottomNav({ activePage = 'home', onNavigate }: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav">
      <a
        href="#"
        className={`mobile-nav-item ${activePage === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate?.('home')}
      >
        <Home size={24} strokeWidth={1.5} />
        <span>Home</span>
      </a>
      <a href="#" className="mobile-nav-item">
        <UserPlus size={24} strokeWidth={1.5} />
        <span>Request</span>
      </a>
      <a href="#" className="mobile-nav-item">
        <Calendar size={24} strokeWidth={1.5} />
        <span>Calendar</span>
      </a>
      <a href="#" className="mobile-nav-item">
        <Users size={24} strokeWidth={1.5} />
        <span>Reflexers</span>
      </a>
      <a
        href="#"
        className={`mobile-nav-item ${activePage === 'talent' ? 'active' : ''}`}
        onClick={() => onNavigate?.('talent')}
      >
        <Menu size={24} strokeWidth={1.5} />
        <span>More</span>
      </a>
    </nav>
  );
}
