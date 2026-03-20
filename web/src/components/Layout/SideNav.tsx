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
} from 'lucide-react';
import './SideNav.css';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

function NavItem({ icon, label, active, onClick, collapsed }: NavItemProps) {
  return (
    <a
      className={`nav-item ${active ? 'active' : ''}`}
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
}

export function SideNav({ activePage = 'home', onNavigate, collapsed = false, onToggleCollapse }: SideNavProps) {
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
                <div className="user-avatar">M</div>
                <span className="user-name">Melissa</span>
              </div>
              <div className="logout-row">
                <button className="logout-btn">Log Out</button>
                <ChevronLeft
                  size={36}
                  className="collapse-icon"
                  onClick={onToggleCollapse}
                />
              </div>
            </>
          ) : (
            <>
              <div className="user-avatar">M</div>
              <div className="expand-row">
                <ChevronRight
                  size={36}
                  className="collapse-icon"
                  onClick={onToggleCollapse}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
