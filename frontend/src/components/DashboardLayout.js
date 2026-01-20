import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BarChart3, FileText, TrendingUp, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/campaigns', icon: TrendingUp },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-[#09090B]" data-testid="dashboard-layout">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-[#020617] border-r border-[#27272A] transition-all duration-300 flex flex-col`}
        data-testid="sidebar"
      >
        <div className="p-5 flex items-center justify-between border-b border-[#27272A]">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-[#FAFAFA] tracking-tight">
              Campaign Pulse
            </h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]"
            data-testid="sidebar-toggle"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  active
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]'
                }`}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" />
                {sidebarOpen && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#27272A]">
          {sidebarOpen && user && (
            <div className="mb-3 px-3">
              <p className="text-sm font-medium text-[#FAFAFA]">{user.full_name}</p>
              <p className="text-xs text-[#A1A1AA]">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]"
            data-testid="logout-button"
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
