import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  LogOut,
  CheckSquare,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    ...(isAdmin ? [{ to: '/users', label: 'Users', icon: Users }] : []),
  ];

  const NavItems = () => (
    <>
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-yellow-300 text-black'
                : 'text-gray-200 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0f2e1f] to-[#1f5c3a]">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-black/20 backdrop-blur-md border-r border-white/10 px-4 py-5 fixed h-full">

        <div className="flex items-center gap-2 px-3 mb-8">
          <CheckSquare size={22} className="text-yellow-300" />
          <span className="font-bold text-white text-base">TaskManager</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <NavItems />
        </nav>

        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-yellow-300 flex items-center justify-center text-black text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-300 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 w-64 bg-[#0f2e1f] flex flex-col px-4 py-5 h-full">
            <div className="flex items-center justify-between px-3 mb-8">
              <div className="flex items-center gap-2">
                <CheckSquare size={22} className="text-yellow-300" />
                <span className="font-bold text-white">TaskManager</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={20} className="text-white" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 flex-1">
              <NavItems />
            </nav>

            <div className="border-t border-white/10 pt-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-60">

        {/* Mobile Header */}
        <header style={{ display: window.innerWidth < 768 ? "flex" : "none" }}
  className="bg-[#0f2e1f] border-b border-white/10 px-4 py-3 items-center gap-3"
>
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <CheckSquare size={20} className="text-yellow-300" />
            <span className="font-bold text-white">TaskManager</span>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-8 text-white">
          <Outlet />
        </main>

      </div>
    </div>
  );
}