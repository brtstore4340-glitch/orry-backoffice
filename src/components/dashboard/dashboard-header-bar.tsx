import styles from "@/components/dashboard/dashstack-dashboard.module.css";
import type { DashboardHeaderModel } from "@/lib/dashboard/dashboard-data";

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.headerIcon}>
      <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13.5 13.5 17 17" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.headerIcon}>
      <path
        d="M10 3.5c-2.3 0-4.1 1.8-4.1 4.1v1.8c0 .6-.2 1.2-.6 1.7l-1 1.3h11.5l-1-1.3c-.4-.5-.6-1.1-.6-1.7V7.6c0-2.3-1.8-4.1-4.2-4.1Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M8 15.5c.4.8 1.1 1.2 2 1.2s1.6-.4 2-1.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.chevronIcon}>
      <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

export function DashboardHeaderBar({ model }: { model: DashboardHeaderModel }) {
  return (
    <header className={styles.headerBar}>
      <label className={styles.searchField}>
        <SearchIcon />
        <input type="search" placeholder={model.searchPlaceholder} aria-label="Search dashboard" />
      </label>

      <div className={styles.headerActions}>
        <button type="button" className={styles.iconButton} aria-label={model.notificationLabel}>
          <BellIcon />
          <span className={styles.notificationDot} aria-hidden="true" />
        </button>

        <button type="button" className={styles.languageButton} aria-label="Current language">
          <span>{model.languageLabel}</span>
          <ChevronIcon />
        </button>

        <button type="button" className={styles.profileButton} aria-label="User profile">
          <div className={styles.profileAvatar}>{model.profile.initials}</div>
          <div className={styles.profileMeta}>
            <strong>{model.profile.name}</strong>
            <span>{model.profile.role}</span>
          </div>
        </button>
      </div>
    </header>
  );
}
