import React from 'react';
import {
  BarChart3,
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
  { id: 'dashboard', label: 'ภาพรวม', caption: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'สินค้า', caption: 'Catalog', icon: Package },
  { id: 'orders', label: 'คำสั่งซื้อ', caption: 'Orders', icon: ShoppingCart },
  { id: 'customers', label: 'ลูกค้า B2B', caption: 'Accounts', icon: Users },
  { id: 'settings', label: 'ตั้งค่า', caption: 'Controls', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-[var(--color-border)] bg-sidebar text-[var(--color-foreground)]">
      <div className="border-b border-[var(--color-border)] px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-lg font-extrabold text-black luxury-ring">
            O
          </div>
          <div>
            <p className="text-2xl font-bold tracking-[-0.05em]">ORRY</p>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">Serenity B2B</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-accent-soft)] p-4">
          <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-black/20 text-[var(--color-accent)]">
            <BarChart3 size={18} />
          </div>
          <p className="text-sm font-semibold text-white">Operations cockpit</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-muted-strong)]">ยอดขาย สต็อก และบัญชีลูกค้ารวมไว้ในมุมมองเดียว</p>
        </div>
      </div>

      <nav className="flex-1 px-4 pb-6" aria-label="Primary navigation">
        <div className="grid gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition',
                activeTab === item.id
                  ? 'bg-[var(--color-panel-soft)] text-white shadow-[0_12px_36px_rgba(0,0,0,0.26)]'
                  : 'text-[var(--color-muted-strong)] hover:bg-[var(--color-panel)] hover:text-white',
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  activeTab === item.id
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-muted)] group-hover:text-[var(--color-muted-strong)]',
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{item.label}</span>
                <span className="block text-xs text-[var(--color-muted)]">{item.caption}</span>
              </span>
              {activeTab === item.id ? <ChevronRight size={16} className="text-[var(--color-accent)]" /> : null}
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
          <span className="text-[15px] font-medium">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};
