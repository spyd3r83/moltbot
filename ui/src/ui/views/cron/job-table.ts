import { html, nothing } from "lit";
import { formatCronPayload, formatCronSchedule } from "../../presenter";
import type { CronJob, CronRunLogEntry } from "../../types";
import { formatMs } from "../../format";

export type CronJobRowProps = {
  job: CronJob;
  selected: boolean;
  busy: boolean;
  onClick: () => void;
  onToggle: (job: CronJob, enabled: boolean) => void;
  onRun: (job: CronJob) => void;
  onRemove: (job: CronJob) => void;
};

function getStatusBadge(enabled: boolean) {
  if (!enabled) return html`<span class="badge badge-disabled">Disabled</span>`;
  return html`<span class="badge badge-enabled">Enabled</span>`;
}

export function renderCronJobRow(props: CronJobRowProps) {
  const job = props.job;
  const rowClass = `cron-job-row ${props.selected ? "cron-job-row-selected" : ""}`;
  
  return html`
    <div class=${rowClass} @click=${props.onClick}>
      <div class="cron-job-cell cron-job-cell-name">
        <div class="cron-job-name">${job.name}</div>
        <div class="cron-job-schedule">${formatCronSchedule(job)}</div>
      </div>
      <div class="cron-job-cell cron-job-cell-status">
        ${getStatusBadge(job.enabled)}
      </div>
      <div class="cron-job-cell cron-job-cell-target">
        <span class="cron-job-target">${job.sessionTarget}</span>
      </div>
      <div class="cron-job-cell cron-job-cell-payload">
        <div class="cron-job-payload">${formatCronPayload(job)}</div>
        ${job.agentId ? html`<div class="cron-job-agent">Agent: ${job.agentId}</div>` : nothing}
      </div>
      <div class="cron-job-cell cron-job-cell-actions">
        <button
          class="btn btn-sm btn-action"
          ?disabled=${props.busy}
          @click=${(e: Event) => {
            e.stopPropagation();
            props.onToggle(job, !job.enabled);
          }}
          title="${job.enabled ? 'Disable' : 'Enable'}"
        >
          ${job.enabled ? 'Disable' : 'Enable'}
        </button>
        <button
          class="btn btn-sm btn-action btn-primary"
          ?disabled=${props.busy || !job.enabled}
          @click=${(e: Event) => {
            e.stopPropagation();
            props.onRun(job);
          }}
          title="Run job now"
        >
          Run
        </button>
        <button
          class="btn btn-sm btn-action btn-danger"
          ?disabled=${props.busy}
          @click=${(e: Event) => {
            e.stopPropagation();
            props.onRemove(job);
          }}
          title="Remove job"
        >
          Remove
        </button>
      </div>
    </div>
  `;
}

export type CronHistoryPanelProps = {
  open: boolean;
  job: CronJob | null;
  runs: CronRunLogEntry[];
  onLoadRuns: (jobId: string) => void;
  onClose: () => void;
};

function getStatusIcon(status: string) {
  if (status === "success") {
    return html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-success"><polyline points="20 6 9 17 4 12"/></svg>`;
  }
  if (status === "error" || status === "failed") {
    return html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-error"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  }
  return html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-running"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2a10 10 0 0 0-10 10"/><path d="M12 12 16 8"/></svg>`;
}

export function renderCronHistoryPanel(props: CronHistoryPanelProps) {
  if (!props.open || !props.job) return nothing;

  return html`
    <div class="cron-history-panel">
      <div class="cron-history-header">
        <div class="cron-history-title">
          <h3>Run History</h3>
          <div class="cron-history-subtitle">${props.job.name}</div>
        </div>
        <button class="btn-icon btn-close" @click=${props.onClose} aria-label="Close history">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="cron-history-body">
        ${props.runs.length === 0
          ? html`<div class="cron-history-empty">No runs yet</div>`
          : html`
              <div class="cron-history-list">
                ${props.runs.map((run) => html`
                  <div class="cron-history-item">
                    <div class="cron-history-item-main">
                      <div class="cron-history-status">
                        ${getStatusIcon(run.status)}
                        <span class="cron-history-status-text">${run.status}</span>
                      </div>
                      <div class="cron-history-time">${formatMs(run.ts)}</div>
                      <div class="cron-history-duration">${run.durationMs ?? 0}ms</div>
                    </div>
                    ${run.summary ? html`<div class="cron-history-summary">${run.summary}</div>` : nothing}
                    ${run.error ? html`<div class="cron-history-error">${run.error}</div>` : nothing}
                  </div>
                `)}
              </div>
            `}
      </div>
    </div>
  `;
}
