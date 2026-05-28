import React from 'react';
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { cn } from '../utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--color-border)] bg-sidebar text-[var(--color-foreground)]">
      <div className="border-b border-[var(--color-border)] px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-extrabold text-black">
            O
          </div>
          <span className="text-2xl font-bold tracking-[-0.04em]">ORRY</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6" aria-label="Primary navigation">
        <div className="grid gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition',
                activeTab === item.id
                  ? 'bg-[var(--color-panel-soft)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.35)]'
                  : 'text-[var(--color-muted-strong)] hover:bg-[var(--color-panel)] hover:text-white',
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  activeTab === item.id
                    ? 'text-white'
                    : 'text-[var(--color-muted)] group-hover:text-[var(--color-muted-strong)]',
                )}
              />
              <span className="flex-1 text-[15px] font-medium">{item.label}</span>
              {activeTab === item.id ? (
                <ChevronRight size={16} className="text-[var(--color-muted)]" />
              ) : null}
            </button>
          ))}
        </div>
      </nav>

      <div className="border-t border-[var(--color-border)] px-4 py-5">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-[var(--color-muted-strong)] transition hover:bg-[var(--color-panel)] hover:text-white"
        >
          <LogOut size={20} className="text-[var(--color-muted)]" />
          <span className="text-[15px] font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
