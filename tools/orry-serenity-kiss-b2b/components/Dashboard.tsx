import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  PackageCheck,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils';

const stats = [
  { label: 'Revenue MTD', value: '฿4.82M', change: '+12.5%', trend: 'up', icon: CircleDollarSign },
  { label: 'Active B2B accounts', value: '248', change: '+18.2%', trend: 'up', icon: Users },
  { label: 'Open orders', value: '86', change: '-3.1%', trend: 'down', icon: ShoppingCart },
  { label: 'Fulfillment SLA', value: '97.4%', change: '+2.4%', trend: 'up', icon: PackageCheck },
];

const recentOrders = [
  { id: 'SO-10291', customer: 'Serenity Spa Group', status: 'Delivered', amount: '฿128,400', date: 'วันนี้ 10:42' },
  { id: 'SO-10290', customer: 'Luxe Wellness Bangkok', status: 'Processing', amount: '฿86,250', date: 'วันนี้ 09:15' },
  { id: 'SO-10287', customer: 'Zen Retreat Phuket', status: 'Shipped', amount: '฿214,900', date: 'เมื่อวาน 16:20' },
  { id: 'SO-10283', customer: 'Aura Boutique', status: 'Pending', amount: '฿42,700', date: 'เมื่อวาน 11:05' },
];

const topProducts = [
  { name: 'Serenity Kiss Serum', meta: 'Skincare • 420 sold', price: '฿2,890', delta: '+12%' },
  { name: 'Silk Renewal Cream', meta: 'Beauty • 280 sold', price: '฿3,120', delta: '+9%' },
  { name: 'Night Repair Oil', meta: 'Body Care • 198 sold', price: '฿2,640', delta: '+7%' },
];

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'Delivered'
      ? 'bg-[rgba(74,222,128,0.12)] text-[var(--color-success)]'
      : status === 'Processing'
        ? 'bg-[rgba(250,204,21,0.12)] text-[var(--color-warning)]'
        : status === 'Shipped'
          ? 'bg-[rgba(125,171,255,0.12)] text-[#8fb6ff]'
          : 'bg-white/8 text-[var(--color-muted-strong)]';

  return <span className={cn('rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]', tone)}>{status}</span>;
}

function ProductThumb({ index }: { index: number }) {
  const tones = [
    'from-[#d8b978] to-[#5c4720]',
    'from-[#a990ba] to-[#3c3148]',
    'from-[#91a4be] to-[#2d3441]',
  ];

  return (
    <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br luxury-ring', tones[index % tones.length])}>
      <div className="h-10 w-10 rounded-xl border border-white/20 bg-white/15" />
    </div>
  );
}

export const Dashboard: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(216,185,120,0.12),transparent_34%),radial-gradient(circle_at_center,rgba(255,255,255,0.035),transparent_42%)] p-5 sm:p-8">
      <div className="mx-auto grid max-w-7xl gap-7">
        <header className="panel overflow-hidden rounded-[28px] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                <BadgeCheck size={14} /> Executive ready
              </div>
              <h1 className="text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">ORRY Serenity Kiss B2B</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-muted-strong)] sm:text-lg">
                Back office สำหรับทีมขายและ operations: อ่านตัวเลขสำคัญเร็ว ตัดสินใจได้ทัน และคุม order flow แบบไม่รกหน้าจอ
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-panel)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-panel-hover)]">
                Export report
              </button>
              <button className="rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-bold text-black transition hover:brightness-110">
                New order
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.article
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="panel rounded-[24px] p-5"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <stat.icon size={22} />
                </div>
                <div
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold',
                    stat.trend === 'up'
                      ? 'bg-[rgba(74,222,128,0.12)] text-[var(--color-success)]'
                      : 'bg-[rgba(251,113,133,0.12)] text-[var(--color-danger)]',
                  )}
                >
                  {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>
              <p className="mb-1 text-sm font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">{stat.label}</p>
              <h2 className="text-4xl font-bold tracking-[-0.05em] text-white">{stat.value}</h2>
            </motion.article>
          ))}
        </section>

        <div className="grid gap-7 xl:grid-cols-[minmax(0,1.5fr)_380px]">
          <section className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-[-0.04em] text-white">Recent orders</h2>
              <button className="text-sm font-semibold text-[var(--color-accent)] transition hover:text-white">View all</button>
            </div>

            <div className="panel overflow-hidden rounded-[24px]">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-white/[0.025]">
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">Order</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">Customer</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">Status</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">Amount</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-t border-[var(--color-border)] transition hover:bg-white/[0.03]">
                        <td className="px-5 py-4 font-mono text-sm font-semibold text-white">{order.id}</td>
                        <td className="px-5 py-4 text-sm font-medium text-[var(--color-muted-strong)]">{order.customer}</td>
                        <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                        <td className="px-5 py-4 text-lg font-bold text-white">{order.amount}</td>
                        <td className="px-5 py-4 text-sm text-[var(--color-muted)]">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside className="grid content-start gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-[-0.04em] text-white">Top products</h2>
              <button className="text-sm font-semibold text-[var(--color-accent)] transition hover:text-white">View all</button>
            </div>

            <div className="grid gap-4">
              {topProducts.map((product, index) => (
                <article key={product.name} className="panel flex items-center gap-4 rounded-[24px] p-4">
                  <ProductThumb index={index} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-white">{product.name}</h3>
                    <p className="text-sm text-[var(--color-muted)]">{product.meta}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{product.price}</p>
                    <p className="text-xs font-bold text-[var(--color-success)]">{product.delta}</p>
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
