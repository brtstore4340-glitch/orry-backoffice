'use client';

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  TriangleAlert,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type IconName = "email" | "password" | "user";
type BadgeVariant = "default" | "success" | "warning" | "info" | "accent";

function resolveIcon(icon: IconName) {
  switch (icon) {
    case "user":
      return User;
    case "password":
      return Lock;
    default:
      return Mail;
  }
}

function Badge({
  children,
  variant = "default",
  dot = false,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}) {
  const styles: Record<BadgeVariant, string> = {
    default:
      "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.10)] text-[var(--muted)]",
    success:
      "bg-[rgba(143,212,187,0.10)] border-[rgba(143,212,187,0.22)] text-[var(--success)]",
    warning:
      "bg-[rgba(237,190,132,0.10)] border-[rgba(237,190,132,0.22)] text-[var(--warning)]",
    info: "bg-[rgba(191,168,232,0.10)] border-[rgba(191,168,232,0.24)] text-[var(--info)]",
    accent:
      "bg-[rgba(212,154,176,0.10)] border-[rgba(212,154,176,0.24)] text-[var(--accent)]",
  };
  const dotStyles: Record<BadgeVariant, string> = {
    default: "bg-[var(--muted)]",
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    info: "bg-[var(--info)]",
    accent: "bg-[var(--accent)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[11px] font-[600] uppercase tracking-[0.07em] ${styles[variant]}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${dotStyles[variant]}`} />
      )}
      {children}
    </span>
  );
}

const STATUS_CARDS = [
  {
    label: "Oracle brain",
    value: "Tham + Omega",
    badge: { text: "Active", variant: "success" as BadgeVariant },
  },
  {
    label: "Execution lanes",
    value: "6 active lanes",
    badge: { text: "Live", variant: "accent" as BadgeVariant },
  },
  {
    label: "Secure channel",
    value: "TLS 1.3 encrypted",
    badge: { text: "Secure", variant: "info" as BadgeVariant },
  },
  {
    label: "Approval queue",
    value: "Managed access",
    badge: { text: "Guarded", variant: "warning" as BadgeVariant },
  },
] as const;

function AuthDecoPanel() {
  return (
    <div className="relative flex h-full min-h-[760px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-[var(--border)] bg-[rgba(14,11,20,0.55)] px-10 py-12">
      {/* Warm glow blobs — CSS only, zero JS */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute right-[8%] top-[10%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,_rgba(212,154,176,0.18)_0%,_transparent_70%)] blur-[50px]" />
        <div className="absolute bottom-[12%] left-[10%] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,_rgba(241,201,162,0.14)_0%,_transparent_70%)] blur-[52px]" />
        <div className="absolute left-[42%] top-[48%] h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(191,168,232,0.10)_0%,_transparent_70%)] blur-[44px]" />
      </div>

      <div className="relative z-10 w-full max-w-[380px]">
        {/* Top badge row */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge variant="success" dot>
            System Online
          </Badge>
          <Badge variant="info">ORRY Business</Badge>
          <Badge variant="default">v2.1</Badge>
        </div>

        {/* Wordmark */}
        <h2 className="mb-1 text-[28px] font-[800] tracking-[-0.03em] text-[var(--foreground)]">
          Mission Control
        </h2>
        <p className="mb-6 text-[14px] leading-6 text-[var(--muted)]">
          Oracle-powered ERP — queue, proof, lane routing, and approval in one workspace.
        </p>

        {/* Status cards */}
        <div className="flex flex-col gap-2.5">
          {STATUS_CARDS.map((card) => (
            <div
              key={card.label}
              className="flex items-center justify-between rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3.5 backdrop-blur-[6px] transition-colors duration-200 hover:border-[rgba(233,207,219,0.32)] hover:bg-[var(--surface-elevated)]"
            >
              <div>
                <p className="m-0 text-[11px] font-[500] uppercase tracking-[0.06em] text-[var(--muted)]">
                  {card.label}
                </p>
                <p className="m-0 mt-1 text-[14px] font-[600] text-[var(--foreground)]">
                  {card.value}
                </p>
              </div>
              <Badge variant={card.badge.variant}>{card.badge.text}</Badge>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-5 flex items-center gap-2 text-[12px] text-[var(--muted)]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--success)]" strokeWidth={2} />
          <span>Access managed by Oracle authorization layer</span>
        </div>
      </div>
    </div>
  );
}

export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-5 py-8"
      style={{ fontFamily: "var(--font-sans), 'Noto Sans', sans-serif" }}
    >
      <section className="relative flex min-h-[860px] w-full max-w-[1440px] overflow-hidden rounded-[34px] border border-[var(--border)] bg-[rgba(14,11,20,0.70)] p-5 shadow-[var(--shadow-soft)] backdrop-blur-[16px] sm:p-7">
        <div className="relative z-10 grid w-full gap-5 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
          {/* Form panel */}
          <div className="flex min-h-[760px] items-center justify-center rounded-[28px] px-4 py-6 sm:px-8">
            <div className="w-full max-w-[460px] rounded-[32px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-8 py-10 shadow-[var(--shadow-panel)] backdrop-blur-[8px] sm:px-12">
              {/* Brand badges */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <Badge variant="accent" dot>
                  ORRY
                </Badge>
                <Badge variant="success" dot>
                  Secure
                </Badge>
              </div>

              <header>
                <h1 className="m-0 text-[30px] font-[700] leading-[1.2] tracking-[-0.025em] text-[var(--foreground)]">
                  {title}
                </h1>
                <p className="mb-0 mt-2 text-[15px] font-[400] leading-6 text-[var(--muted)]">
                  {subtitle}
                </p>
              </header>

              <div className="mt-8 flex flex-col gap-6">{children}</div>

              {footer ? (
                <div className="mt-10 text-center text-[14px] font-[400] text-[var(--muted)]">
                  {footer}
                </div>
              ) : null}
            </div>
          </div>

          {/* Decorative right panel */}
          <div className="hidden lg:block">
            <AuthDecoPanel />
          </div>
        </div>
      </section>
    </main>
  );
}

export function AuthField({
  icon,
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required = true,
  autoComplete,
}: {
  icon: IconName;
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const Icon = useMemo(() => resolveIcon(icon), [icon]);

  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-[600] leading-none tracking-[0.01em] text-[var(--foreground-soft)]">
        {label}
      </span>
      <div className="relative h-[52px]">
        <Icon
          className="pointer-events-none absolute left-4 top-[14px] h-[22px] w-[22px] text-[var(--muted)]"
          strokeWidth={1.8}
        />
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          autoComplete={autoComplete}
          className="h-[52px] w-full rounded-[14px] border border-[var(--border-strong)] bg-[rgba(255,255,255,0.04)] pl-[46px] pr-4 text-[14px] font-[400] text-[var(--foreground)] outline-none transition-all duration-200 placeholder:text-[var(--muted)] hover:border-[rgba(233,207,219,0.35)] hover:bg-[rgba(255,255,255,0.06)] focus:border-[var(--accent)] focus:bg-[rgba(212,154,176,0.06)] focus:ring-1 focus:ring-[var(--accent)]/20"
        />
      </div>
    </label>
  );
}

export function AuthPasswordField({
  label,
  name,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  placeholder: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-[600] leading-none tracking-[0.01em] text-[var(--foreground-soft)]">
        {label}
      </span>
      <div className="relative h-[52px]">
        <Lock
          className="pointer-events-none absolute left-4 top-[14px] h-[22px] w-[22px] text-[var(--muted)]"
          strokeWidth={1.8}
        />
        <input
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          required
          autoComplete={autoComplete}
          className="h-[52px] w-full rounded-[14px] border border-[var(--border-strong)] bg-[rgba(255,255,255,0.04)] pl-[46px] pr-12 text-[14px] font-[400] text-[var(--foreground)] outline-none transition-all duration-200 placeholder:text-[var(--muted)] hover:border-[rgba(233,207,219,0.35)] hover:bg-[rgba(255,255,255,0.06)] focus:border-[var(--accent)] focus:bg-[rgba(212,154,176,0.06)] focus:ring-1 focus:ring-[var(--accent)]/20"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-4 top-[14px] cursor-pointer border-0 bg-transparent p-0 text-[var(--muted)] transition-colors duration-200 hover:text-[var(--accent)]"
        >
          {visible ? (
            <EyeOff className="h-[22px] w-[22px]" strokeWidth={1.8} />
          ) : (
            <Eye className="h-[22px] w-[22px]" strokeWidth={1.8} />
          )}
        </button>
      </div>
    </label>
  );
}

export function AuthCheckbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[14px] font-[400] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground-soft)]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 cursor-pointer rounded-[4px] border border-[var(--border-strong)] bg-[rgba(255,255,255,0.04)] accent-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
      />
      <span>{label}</span>
    </label>
  );
}

export function AuthNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-[rgba(238,140,157,0.28)] bg-[rgba(238,140,157,0.08)] px-4 py-3 text-[14px] font-[500] text-[var(--danger)]">
      <div className="flex items-start gap-2">
        <TriangleAlert className="mt-[1px] h-4 w-4 shrink-0" strokeWidth={2} />
        <span>{children}</span>
      </div>
    </div>
  );
}

export function AuthSuccess({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-[rgba(143,212,187,0.28)] bg-[rgba(143,212,187,0.08)] px-4 py-3 text-[14px] font-[500] text-[var(--success)]">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="mt-[1px] h-4 w-4 shrink-0" strokeWidth={2} />
        <span>{children}</span>
      </div>
    </div>
  );
}

function SubmitButtonInner({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[14px] border-0 bg-[var(--primary-action)] text-[15px] font-[700] text-[#1a1008] shadow-[0_4px_20px_rgba(241,201,162,0.22)] transition-all duration-200 hover:bg-[var(--primary-action-strong)] hover:shadow-[0_4px_28px_rgba(241,201,162,0.34)] disabled:cursor-not-allowed disabled:opacity-55"
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
      ) : (
        <>
          <span>{children}</span>
          {icon && <ArrowRight className="h-5 w-5" strokeWidth={2.5} />}
        </>
      )}
    </button>
  );
}

export function AuthSubmitButton({
  children,
  icon = true,
}: {
  children: React.ReactNode;
  icon?: boolean;
}) {
  return <SubmitButtonInner icon={icon}>{children}</SubmitButtonInner>;
}

export function AuthSecondaryLinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[14px] border border-[var(--border-strong)] bg-[rgba(255,255,255,0.04)] px-4 text-[15px] font-[500] text-[var(--foreground-soft)] no-underline transition-all duration-200 hover:border-[rgba(233,207,219,0.35)] hover:bg-[rgba(255,255,255,0.07)]"
    >
      {children}
    </Link>
  );
}

export function AuthInlineLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-[600] text-[var(--accent)] no-underline transition-colors duration-200 hover:text-[var(--primary-action)]"
    >
      {children}
    </Link>
  );
}
