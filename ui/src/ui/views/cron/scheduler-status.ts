import { html, nothing } from "lit";
import { formatAgo } from "../../format";
import { formatNextRun } from "../../presenter";
import type { CronStatus } from "../../types";

export type SchedulerStatusProps = {
  status: CronStatus | null;
  loading: boolean;
  lastUpdatedMs: number | null;
  onRefresh: () => void;
};

export function renderSchedulerStatus(props: SchedulerStatusProps) {
  return html`
    <div class="card">
      <div class="card-title">Scheduler</div>
      <div class="card-sub">Gateway-owned cron scheduler status.</div>
      <div class="stat-grid" style="margin-top: 16px;">
        <div class="stat">
          <div class="stat-label">Enabled</div>
          <div class="stat-value">
            ${props.status
              ? props.status.enabled
                ? "Yes"
                : "No"
              : "n/a"}
          </div>
        </div>
        <div class="stat">
          <div class="stat-label">Jobs</div>
          <div class="stat-value">${props.status?.jobs ?? "n/a"}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Next wake</div>
          <div class="stat-value">${formatNextRun(props.status?.nextWakeAtMs ?? null)}</div>
        </div>
      </div>
      <div class="row" style="margin-top: 12px; align-items: center; gap: 12px;">
        <button
          class="btn"
          ?disabled=${props.loading}
          @click=${props.onRefresh}
          aria-label="Refresh scheduler data"
        >
          ${props.loading
            ? html`<span class="loading-spinner"></span> Refreshing…`
            : "Refresh"}
        </button>
        ${props.lastUpdatedMs
          ? html`<span class="muted" aria-live="polite">Updated ${formatAgo(props.lastUpdatedMs)}</span>`
          : nothing}
      </div>
    </div>
  `;
}
