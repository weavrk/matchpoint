import {
  Home,
  UserPlus,
  Calendar,
  Users,
  Sparkles,
  ChartSpline,
  Store,
  CalendarClock,
  Settings,
  LifeBuoy,
  ChevronLeft,
} from 'lucide-react';
import './SideNav.css';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <a
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
      href="#"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

interface SideNavProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
}

export function SideNav({ activePage = 'home', onNavigate }: SideNavProps) {
  return (
    <nav className="side-nav">
      <a href="#" className="logo" aria-label="Reflex">
        <img src="/images/wordmark.svg" alt="Reflex" className="logo-img" />
      </a>

      <div className="side-nav-card">
        <NavItem icon={<Home size={20} />} label="Home" active={activePage === 'home'} onClick={() => onNavigate?.('home')} />
        <NavItem icon={<UserPlus size={20} />} label="Request Flex" />
        <NavItem icon={<Calendar size={20} />} label="Calendar" />
        <NavItem icon={<Users size={20} />} label="Reflexers" />
        <NavItem icon={<Sparkles size={20} />} label="Talent Portal" active={activePage === 'talent'} onClick={() => onNavigate?.('talent')} />
        <NavItem icon={<ChartSpline size={20} />} label="Reports" />
        <NavItem icon={<Store size={20} />} label="Locations" />
        <NavItem icon={<CalendarClock size={20} />} label="Budgets" />
        <NavItem icon={<Settings size={20} />} label="Settings" />
        <NavItem icon={<LifeBuoy size={20} />} label="Support" />
      </div>

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
      <div className="nav-footer">
        <div className="user-section">
          <div className="user-row">
            <div className="user-avatar">M</div>
            <span className="user-name">Melissa</span>
          </div>
          <div className="logout-row">
            <button className="logout-btn">Log Out</button>
            <ChevronLeft size={40} className="collapse-icon" />
          </div>
        </div>
      </div>
    </nav>
  );
}
