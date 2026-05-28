import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils';

const stats = [
  { label: 'Total Revenue', value: '$128,430', change: '+12.5%', trend: 'up', icon: DollarSign },
  { label: 'Active Customers', value: '2,420', change: '+18.2%', trend: 'up', icon: Users },
  { label: 'Total Orders', value: '1,210', change: '-3.1%', trend: 'down', icon: ShoppingCart },
  { label: 'Inventory', value: '450', change: '+2.4%', trend: 'up', icon: Package },
];

const recentOrders = [
  { id: '#ORD-001', customer: 'Serenity Spa', status: 'DELIVERED', amount: '$1,200', date: '2 mins ago' },
  { id: '#ORD-002', customer: 'Luxe Wellness', status: 'PROCESSING', amount: '$850', date: '15 mins ago' },
  { id: '#ORD-003', customer: 'Zen Retreat', status: 'SHIPPED', amount: '$2,100', date: '1 hour ago' },
  { id: '#ORD-004', customer: 'Aura Boutique', status: 'PENDING', amount: '$450', date: '3 hours ago' },
];

const topProducts = [
  { name: 'Serenity Kiss Serum', meta: 'Skincare • 420 sold', price: '$89.00', delta: '+12%' },
  { name: 'Silk Renewal Cream', meta: 'Beauty • 280 sold', price: '$92.00', delta: '+9%' },
  { name: 'Night Repair Oil', meta: 'Body Care • 198 sold', price: '$76.00', delta: '+7%' },
];

function ProductThumb({ index }: { index: number }) {
  const tones = [
    'from-[#7d6b2a] to-[#3a3218]',
    'from-[#6f5f7f] to-[#2e2936]',
    'from-[#69758a] to-[#252933]',
  ];

  return (
    <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br', tones[index % tones.length])}>
      <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/10" />
    </div>
  );
}

export const Dashboard: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_48%)] p-8">
      <div className="mx-auto grid max-w-7xl gap-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-[-0.05em] text-white">Dashboard</h1>
            <p className="text-2xl text-[var(--color-muted)]">Welcome back, here's what's happening today.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-panel)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-panel-hover)]">
              Download Report
            </button>
            <button className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-[#ececf1]">
              Create Order
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.article
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="panel rounded-[22px] p-6"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--color-panel-soft)] text-white">
                  <stat.icon size={24} />
                </div>
                <div
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold',
                    stat.trend === 'up'
                      ? 'bg-[rgba(0,196,140,0.12)] text-[var(--color-success)]'
                      : 'bg-[rgba(240,91,120,0.12)] text-[var(--color-danger)]',
                  )}
                >
                  {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>
              <p className="mb-1 text-lg text-[var(--color-muted)]">{stat.label}</p>
              <h2 className="text-5xl font-bold tracking-[-0.05em] text-white">{stat.value}</h2>
            </motion.article>
          ))}
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <section className="grid gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[2rem] font-bold tracking-[-0.04em] text-white">Recent Orders</h2>
              <button className="text-lg text-[var(--color-muted)] transition hover:text-white">View All</button>
            </div>

            <div className="panel overflow-hidden rounded-[22px]">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.02)]">
                      <th className="px-6 py-5 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">Order ID</th>
                      <th className="px-6 py-5 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">Customer</th>
                      <th className="px-6 py-5 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">Status</th>
                      <th className="px-6 py-5 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">Amount</th>
                      <th className="px-6 py-5 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-t border-[var(--color-border)] transition hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="px-6 py-5 font-mono text-lg font-semibold text-white">{order.id}</td>
                        <td className="px-6 py-5 text-lg font-medium text-[var(--color-muted-strong)]">{order.customer}</td>
                        <td className="px-6 py-5">
                          <span
                            className={cn(
                              'rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]',
                              order.status === 'DELIVERED'
                                ? 'bg-[rgba(0,196,140,0.12)] text-[var(--color-success)]'
                                : order.status === 'PROCESSING'
                                  ? 'bg-[rgba(255,193,92,0.12)] text-[#ffc15c]'
                                  : order.status === 'SHIPPED'
                                    ? 'bg-[rgba(100,149,237,0.12)] text-[#7aa2ff]'
                                    : 'bg-[rgba(255,255,255,0.08)] text-[var(--color-muted-strong)]',
                            )}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-2xl font-bold text-white">{order.amount}</td>
                        <td className="px-6 py-5 text-base text-[var(--color-muted)]">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside className="grid gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[2rem] font-bold tracking-[-0.04em] text-white">Top Products</h2>
              <button className="text-lg text-[var(--color-muted)] transition hover:text-white">View All</button>
            </div>

            <div className="grid gap-4">
              {topProducts.map((product, index) => (
                <article key={product.name} className="panel flex items-center gap-4 rounded-[22px] p-4">
                  <ProductThumb index={index} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-bold text-white">{product.name}</h3>
                    <p className="text-base text-[var(--color-muted)]">{product.meta}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{product.price}</p>
                    <p className="text-sm font-bold text-[var(--color-success)]">{product.delta}</p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
