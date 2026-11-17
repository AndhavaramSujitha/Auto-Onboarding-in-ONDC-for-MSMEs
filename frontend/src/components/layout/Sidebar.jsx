
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Package,
  FileText,
  Sparkles,
  UploadCloud,
  ShieldCheck,
  Network,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navSections = [
  {
    title: 'WORKSPACE',
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { name: 'Business Profile', to: '/business', icon: Building2 },
    ],
  },
  {
    title: 'CATALOG MANAGEMENT',
    items: [
      { name: 'Product Catalog', to: '/products', icon: Package },
      { name: 'Document Center', to: '/documents', icon: FileText },
      { name: 'AI Catalog Generator', to: '/ai-analysis', icon: Sparkles },
      { name: 'Bulk Upload', to: '/bulk-catalog', icon: UploadCloud },
    ],
  },
  {
    title: 'NETWORK OPERATIONS',
    items: [
      { name: 'ONDC Readiness', to: '/ondc', icon: Network },
      { name: 'Compliance Check', to: '/compliance', icon: ShieldCheck },
      { name: 'Reports & Logs', to: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'PREFERENCES',
    items: [
      { name: 'Settings', to: '/settings', icon: Settings },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72
          flex flex-col
          bg-[#171717] text-slate-200
          border-r border-[#303030]
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="h-[76px] px-6 flex items-center justify-between border-b border-[#303030]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D8BC7A] text-[#202020] flex items-center justify-center">
              <Network className="w-5 h-5" strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[17px] font-bold text-white tracking-tight">
                ONDC Auto
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-[1.5px] mt-0.5">
                Seller Workspace
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#292929] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7 scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.title}>
              <h4 className="px-3 mb-3 text-[10px] font-bold tracking-[1.5px] text-[#999999] uppercase">
                {section.title}
              </h4>

              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) => `
                        group flex items-center gap-3
                        px-3 py-2.5 rounded-lg
                        text-[13px] transition-all duration-200
                        ${
                          isActive
                            ? 'bg-[#D8BC7A] text-[#202020] font-semibold shadow-sm'
                            : 'text-slate-300 hover:bg-[#292929] hover:text-white'
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`w-[18px] h-[18px] shrink-0 ${
                              isActive
                                ? 'text-[#202020]'
                                : 'text-[#D8BC7A]'
                            }`}
                            strokeWidth={1.8}
                          />

                          <span>{item.name}</span>

                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#202020]" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Account */}
        <div className="p-4 border-t border-[#303030]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#222222]">
            <div className="w-9 h-9 rounded-full bg-[#D8BC7A] text-[#202020] flex items-center justify-center font-bold text-sm shrink-0">
              {user?.email?.charAt(0)?.toUpperCase() || 'S'}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">
                {user?.fullName || user?.email || 'Seller'}
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {user?.role || 'Seller Account'}
              </p>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign out"
              className="p-2 rounded-lg text-slate-400 hover:text-[#D8BC7A] hover:bg-[#292929] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
