import { html } from "lit";
import { formatCronState } from "../../presenter";
import type { CronJob } from "../../types";

export type JobListProps = {
  jobs: CronJob[];
  runsJobId: string | null;
  busy: boolean;
  filter: string;
  filterType: "all" | "enabled" | "disabled";
  onLoadRuns: (jobId: string) => void;
  onEdit: (job: CronJob) => void;
  onDuplicate: (job: CronJob) => void;
  onToggle: (job: CronJob, enabled: boolean) => void;
  onRun: (job: CronJob) => void;
  onRemove: (job: CronJob) => void;
  onFilterChange: (filter: string) => void;
  onFilterTypeChange: (type: "all" | "enabled" | "disabled") => void;
};

function renderJob(job: CronJob, props: JobListProps) {
  const isSelected = props.runsJobId === job.id;
  const itemClass = `list-item list-item-clickable${isSelected ? " list-item-selected" : ""}`;

  return html`
    <div class=${itemClass} @click=${() => props.onLoadRuns(job.id)}>
      <div class="list-main">
        <div class="list-title-row">
          <div class="list-title">${job.name}</div>
          <div class="chip-row" style="margin-top: 4px;">
            <span class="chip ${job.enabled ? "chip-enabled" : "chip-disabled"}">${job.enabled ? "enabled" : "disabled"}</span>
            <span class="chip">${job.sessionTarget}</span>
          </div>
        </div>
        <div class="list-meta">
          <div class="list-status">${formatCronState(job)}</div>
          <div class="list-actions">
            <button
              class="btn btn-sm btn-action"
              ?disabled=${props.busy}
              @click=${(event: Event) => {
                event.stopPropagation();
                props.onEdit(job);
              }}
              aria-label="Edit job ${job.name}"
              title="Edit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              class="btn btn-sm btn-action ${job.enabled ? "btn-primary" : ""}"
              ?disabled=${props.busy || !job.enabled}
              @click=${(event: Event) => {
                event.stopPropagation();
                props.onRun(job);
              }}
              title="Run job now"
            >
              Run
            </button>
            <button
              class="btn btn-sm btn-action btn-danger"
              ?disabled=${props.busy}
              @click=${(event: Event) => {
                event.stopPropagation();
                props.onRemove(job);
              }}
              title="Remove job"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

export function renderJobList(props: JobListProps) {
  let filteredJobs = props.jobs;

  if (props.filterType === "enabled") {
    filteredJobs = filteredJobs.filter((j) => j.enabled);
  } else if (props.filterType === "disabled") {
    filteredJobs = filteredJobs.filter((j) => !j.enabled);
  }

  if (props.filter.trim()) {
    const search = props.filter.toLowerCase();
    filteredJobs = filteredJobs.filter(
      (j) =>
        j.name.toLowerCase().includes(search) ||
        j.description?.toLowerCase().includes(search) ||
        j.id.toLowerCase().includes(search),
    );
  }

  return html`
    <div class="card" style="margin-top: 18px;">
        <div class="list-title-row">
          <div class="card-title">Jobs</div>
          <div class="card-sub">All scheduled jobs stored in the gateway.</div>
          <div class="row" style="justify-content: flex-end; gap: 12px;">
            <button
              class="btn"
              @click=${() => {
                const now = Date.now();
                props.onDuplicate({
                  id: "new",
                  name: "New Job",
                  schedule: { kind: "every", everyMs: 86400000 },
                  sessionTarget: "main",
                  payload: { kind: "agentTurn", message: "New job description" },
                  enabled: true,
                  createdAtMs: now,
                  updatedAtMs: now,
                  wakeMode: "next-heartbeat",
                });
              }}
            >
              New Job
            </button>
          </div>
        </div>
      ${props.jobs.length === 0
        ? html`<div class="muted" style="margin-top: 12px;">No jobs yet.</div>`
        : html`
            <div class="filter-bar" style="margin-top: 12px;">
              <div class="filter-bar__search">
                <input
                  type="text"
                  placeholder="Search jobs..."
                  .value=${props.filter}
                  @input=${(e: Event) => {
                    const target = e.target as HTMLInputElement;
                    props.onFilterChange(target.value);
                  }}
                  aria-label="Search jobs"
                />
              </div>
              <div class="filter-bar__tabs">
                <button
                  class="filter-bar__tab ${props.filterType === "all" ? "active" : ""}"
                  @click=${() => props.onFilterTypeChange("all")}
                >
                  All (${props.jobs.length})
                </button>
                <button
                  class="filter-bar__tab ${props.filterType === "enabled" ? "active" : ""}"
                  @click=${() => props.onFilterTypeChange("enabled")}
                >
                  Enabled (${props.jobs.filter((j) => j.enabled).length})
                </button>
                <button
                  class="filter-bar__tab ${props.filterType === "disabled" ? "active" : ""}"
                  @click=${() => props.onFilterTypeChange("disabled")}
                >
                  Disabled (${props.jobs.filter((j) => !j.enabled).length})
                </button>
              </div>
            </div>
            <div class="list">
              ${filteredJobs.length === 0
                ? html`<div class="muted" style="margin-top: 12px;">No matching jobs.</div>`
                : filteredJobs.map((job) => renderJob(job, props))}
            </div>
          `}
    </div>
  `;
}
