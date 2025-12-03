"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './deposit.module.scss';

export default function RefreshButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.refreshButton}
      onClick={() => router.refresh()}
      aria-label="Refresh list"
      title="Refresh"
    >
      <i className="ri-refresh-line" aria-hidden />
    </button>
  );
}
