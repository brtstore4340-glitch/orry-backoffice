/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Bell,
  HelpCircle,
  Menu,
  Search,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-app-bg text-[var(--color-foreground)]">
      <div className="flex h-14 items-center justify-center border-b border-[var(--color-border)] bg-topbar px-4">
        <span className="text-lg font-medium text-[var(--color-muted-strong)]">ORRY Serenity Kiss B2B</span>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-stage-bg lg:grid-cols-[1.1fr_0.9fr]">
          <section className="border-b border-[var(--color-border)] p-8 lg:border-b-0 lg:border-r lg:p-12">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-lg font-extrabold text-black">
                O
              </div>
              <div>
                <p className="text-2xl font-bold tracking-[-0.04em] text-white">ORRY</p>
                <p className="text-sm text-[var(--color-muted)]">Serenity Kiss B2B</p>
              </div>
            </div>

            <div className="grid gap-5">
              <span className="w-fit rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted-strong)]">
                Login
              </span>
              <h1 className="max-w-[10ch] text-5xl font-bold tracking-[-0.06em] text-white">
                Dark theme ตั้งแต่หน้าแรก
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[var(--color-muted)]">
                หน้าเข้าสู่ระบบถูกปรับให้อยู่ใน visual system เดียวกับ dashboard แล้ว ทั้ง top bar, panel, form field,
                และ action state เพื่อให้ flow ของเดโมต่อเนื่องตั้งแต่ก่อนเข้าระบบ
              </p>
            </div>
          </section>

          <section className="flex items-center p-8 lg:p-12">
            <div className="w-full rounded-[24px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 sm:p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-[-0.05em] text-white">Sign in</h2>
                <p className="mt-2 text-base text-[var(--color-muted)]">เข้าสู่ระบบเพื่อดูตัวอย่าง ORRY dark dashboard</p>
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
                    defaultValue="admin@orry.local"
                    className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-stage-bg)] px-4 text-base text-white outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-border-strong)]"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--color-muted-strong)]">Password</span>
                  <input
                    type="password"
                    defaultValue="password"
                    className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-stage-bg)] px-4 text-base text-white outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-border-strong)]"
                  />
                </label>

                <button
                  type="submit"
                  className="mt-2 h-12 rounded-2xl bg-white text-base font-bold text-black transition hover:bg-[#ececf1]"
                >
                  เข้าสู่ระบบ
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
    <div className="h-full overflow-y-auto p-8">
      <div className="panel mx-auto max-w-5xl rounded-[24px] p-10">
        <h2 className="mb-3 text-4xl font-bold tracking-[-0.05em] text-white">{title}</h2>
        <p className="max-w-3xl text-lg leading-8 text-[var(--color-muted)]">{description}</p>
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
            title="Products"
            description="This section is reserved for the products view in the same dark ORRY dashboard system."
          />
        );
      case 'orders':
        return (
          <PlaceholderState
            title="Orders"
            description="This section is reserved for the orders view in the same dark ORRY dashboard system."
          />
        );
      case 'customers':
        return (
          <PlaceholderState
            title="Customers"
            description="This section is reserved for the customers view in the same dark ORRY dashboard system."
          />
        );
      default:
        return (
          <PlaceholderState
            title="Settings"
            description="This section is reserved for the settings view in the same dark ORRY dashboard system."
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
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 22, stiffness: 180 }}
            className="fixed z-50 h-full lg:relative"
          >
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onLogout={() => setIsAuthenticated(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center justify-center border-b border-[var(--color-border)] bg-topbar px-4">
          <div className="absolute left-4 lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-muted-strong)] transition hover:bg-[var(--color-panel)] hover:text-white"
              aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          <span className="text-lg font-medium text-[var(--color-muted-strong)]">ORRY Serenity Kiss B2B</span>
        </div>

        <header className="flex h-20 items-center justify-between gap-6 border-b border-[var(--color-border)] bg-app-bg px-8">
          <div className="flex max-w-2xl flex-1 items-center gap-4">
            <label className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] pl-11 pr-4 text-base text-white outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-border-strong)]"
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-muted)] transition hover:bg-[var(--color-panel)] hover:text-white">
              <Bell size={18} />
            </button>
            <button className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-muted)] transition hover:bg-[var(--color-panel)] hover:text-white">
              <HelpCircle size={18} />
            </button>
            <div className="mx-1 h-10 w-px bg-[var(--color-border)]" />
            <button className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-[var(--color-panel)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-panel-soft)] text-[var(--color-muted-strong)]">
                <User size={18} />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-bold text-white">Admin User</p>
                <p className="text-xs text-[var(--color-muted)]">Super Admin</p>
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
