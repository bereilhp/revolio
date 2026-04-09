"use client";

import { useEffect, useState } from "react";
import styles from "./usage-dashboard.module.css";

const REFRESH_MS = 5000;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const decimals = value >= 10 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unit]}`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "0.00%";
  }

  return `${value.toFixed(2)}%`;
}

export default function UsageDashboard() {
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    let timeoutId;

    const load = async () => {
      try {
        const response = await fetch("/api/usage", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.message ?? "Failed to fetch usage.");
        }

        if (!isActive) {
          return;
        }

        setUsage(payload);
        setError("");
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : String(requestError),
        );
      } finally {
        if (isActive) {
          setLoading(false);
          timeoutId = window.setTimeout(load, REFRESH_MS);
        }
      }
    };

    load();

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Docker Usage</h1>
      <p className={styles.subtitle}>Refreshes every {REFRESH_MS / 1000}s</p>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading && !usage ? <p className={styles.status}>Loading...</p> : null}

      {!loading && usage?.containers?.length === 0 ? (
        <p className={styles.status}>No running containers.</p>
      ) : null}

      {usage?.containers?.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.headerCell}>Container</th>
              <th className={styles.headerCell}>CPU</th>
              <th className={styles.headerCell}>Memory</th>
              <th className={styles.headerCell}>Network</th>
            </tr>
          </thead>
          <tbody>
            {usage.containers.map((container) => (
              <tr key={container.id}>
                <td className={styles.nameCell}>
                  <div>{container.name}</div>
                  <div className={styles.image}>{container.image}</div>
                </td>
                <td>{formatPercent(container.cpuPercent)}</td>
                <td>
                  {formatBytes(container.memoryUsageBytes)} /{" "}
                  {formatBytes(container.memoryLimitBytes)} (
                  {formatPercent(container.memoryPercent)})
                </td>
                <td>
                  ↓ {formatBytes(container.networkRxBytes)} / ↑{" "}
                  {formatBytes(container.networkTxBytes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {usage?.collectedAt ? (
        <p className={styles.updatedAt}>
          Last update: {new Date(usage.collectedAt).toLocaleTimeString()}
        </p>
      ) : null}
    </main>
  );
}
