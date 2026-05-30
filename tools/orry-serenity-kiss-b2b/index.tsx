import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Bell,
  HelpCircle,
  Menu,
  Search,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import './index.css';

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-app-bg text-[var(--color-foreground)]">
      <div className="flex h-14 items-center justify-center border-b border-[var(--color-border)] bg-sidebar px-4">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-strong)]">ORRY Serenity Kiss B2B</span>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(216,185,120,0.14),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_32%)] p-6">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-stage-bg)] luxury-ring lg:grid-cols-[1.08fr_0.92fr]">
          <section className="border-b border-[var(--color-border)] p-8 lg:border-b-0 lg:border-r lg:p-12">
            <div className="mb-12 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-lg font-extrabold text-black">
                O
              </div>
              <div>
                <p className="text-2xl font-bold tracking-[-0.05em] text-white">ORRY</p>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">Serenity Kiss B2B</p>
              </div>
            </div>

            <div className="grid gap-5">
              <span className="w-fit rounded-full border border-[var(--color-border-strong)] bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                Back office preview
              </span>
              <h1 className="max-w-[11ch] text-5xl font-bold tracking-[-0.065em] text-white sm:text-6xl">
                Luxury operations, without the noise.
              </h1>
              <p className="max-w-xl text-base leading-8 text-[var(--color-muted-strong)] sm:text-lg">
                เดโม ORRY สำหรับทีม B2B ที่เน้น dashboard สะอาด อ่านเร็ว และใช้กับงานจริงได้: sales, orders, customers และ fulfillment อยู่ใน system เดียวกัน
              </p>
            </div>
          </section>

          <section className="flex items-center p-8 lg:p-12">
            <div className="w-full rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 sm:p-8">
              <div className="mb-8">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-3xl font-bold tracking-[-0.05em] text-white">Sign in</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">ใช้สำหรับ preview เท่านั้น ระบบจริงต้องต่อ auth/server-side approval ก่อนเปิดใช้งานจริง</p>
              </div>

              <form
                className="grid gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  onLogin();
                }}
              >
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--color-muted-strong)]">Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="admin@orry.local"
                    className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-stage-bg)] px-4 text-base text-white outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--color-muted-strong)]">Password</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-stage-bg)] px-4 text-base text-white outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                  />
                </label>

                <button
                  type="submit"
                  className="mt-2 h-12 rounded-2xl bg-[var(--color-accent)] text-base font-bold text-black transition hover:brightness-110"
                >
                  เข้าสู่แดชบอร์ด
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PlaceholderState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8">
      <div className="panel mx-auto max-w-5xl rounded-[28px] p-8 sm:p-10">
        <h2 className="mb-3 text-4xl font-bold tracking-[-0.05em] text-white">{title}</h2>
        <p className="max-w-3xl text-lg leading-8 text-[var(--color-muted-strong)]">{description}</p>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return (
          <PlaceholderState
            title="สินค้า"
            description="พื้นที่สำหรับ catalog, price tier, stock visibility และ product controls ใน ORRY visual system เดียวกัน"
          />
        );
      case 'orders':
        return (
          <PlaceholderState
            title="คำสั่งซื้อ"
            description="พื้นที่สำหรับ sales order lifecycle, fulfillment status, payment status และเอกสารที่เกี่ยวข้อง"
          />
        );
      case 'customers':
        return (
          <PlaceholderState
            title="ลูกค้า B2B"
            description="พื้นที่สำหรับ account profile, credit terms, contacts และ activity history ของลูกค้า B2B"
          />
        );
      default:
        return (
          <PlaceholderState
            title="ตั้งค่า"
            description="พื้นที่สำหรับ role, approval policy, company profile และ operational controls ก่อนเชื่อม backend จริง"
          />
        );
    }
  };

  if (!isLoaded) {
    return null;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-app-bg font-sans text-[var(--color-foreground)]">
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 24, stiffness: 180 }}
            className="fixed z-50 h-full lg:relative"
          >
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              onLogout={() => setIsAuthenticated(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close mobile menu overlay"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center justify-center border-b border-[var(--color-border)] bg-sidebar px-4">
          <div className="absolute left-4 lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-muted-strong)] transition hover:bg-[var(--color-panel)] hover:text-white"
              aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-strong)]">ORRY Serenity Kiss B2B</span>
        </div>

        <header className="flex h-20 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-app-bg px-4 sm:px-8">
          <div className="flex max-w-2xl flex-1 items-center gap-4">
            <label className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                type="text"
                placeholder="ค้นหา order, ลูกค้า, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] pl-11 pr-4 text-base text-white outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden h-11 w-11 items-center justify-center rounded-xl text-[var(--color-muted)] transition hover:bg-[var(--color-panel)] hover:text-white sm:inline-flex" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button className="hidden h-11 w-11 items-center justify-center rounded-xl text-[var(--color-muted)] transition hover:bg-[var(--color-panel)] hover:text-white sm:inline-flex" aria-label="Help">
              <HelpCircle size={18} />
            </button>
            <div className="hidden h-10 w-px bg-[var(--color-border)] sm:block" />
            <button className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-[var(--color-panel)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <User size={18} />
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-bold text-white">Admin User</p>
                <p className="text-xs text-[var(--color-muted)]">Operations lead</p>
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden bg-stage-bg">
          <div className="h-full animate-fade-in">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
