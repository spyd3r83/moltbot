import { html, nothing } from "lit";
import { formatMs } from "../../format";
import type { CronJob, CronRunLogEntry } from "../../types";

export type RunHistoryProps = {
  open: boolean;
  job: CronJob | null;
  runs: CronRunLogEntry[];
  onClose: () => void;
};

function renderRun(entry: CronRunLogEntry) {
  return html`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${entry.status}</div>
        <div class="list-sub">${entry.summary ?? ""}</div>
      </div>
      <div class="list-meta">
        <div>${formatMs(entry.ts)}</div>
        <div class="muted">${entry.durationMs ?? 0}ms</div>
        ${entry.error ? html`<div class="muted">${entry.error}</div>` : nothing}
      </div>
    </div>
  `;
}

export function renderRunHistory(props: RunHistoryProps) {
  if (!props.open || !props.job) return nothing;

  return html`
    <div class="modal-overlay" @click=${props.onClose}>
      <div class="modal-content run-history-modal" @click=${(e: Event) => e.stopPropagation()}>
        <div class="modal-header">
          <h3 class="card-title">Run History</h3>
          <button class="modal-close" @click=${props.onClose} aria-label="Close run history">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="card-sub">${props.job.name} - Latest runs</div>
          ${props.runs.length === 0
            ? html`<div class="muted" style="margin-top: 12px;">No runs yet.</div>`
            : html`
                <div class="list" style="margin-top: 12px;">
                  ${props.runs.map((entry) => renderRun(entry))}
                </div>
              `}
        </div>
      </div>
    </div>
  `;
}
