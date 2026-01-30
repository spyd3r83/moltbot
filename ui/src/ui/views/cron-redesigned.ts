import { html, nothing } from "lit";
import { renderCronJobRow, renderCronHistoryPanel } from "./job-table";
import { renderCronEditModal } from "./job-edit-modal";
import { renderSchedulerStatus } from "./scheduler-status";
import type { CronJob, CronRunLogEntry, CronStatus } from "../types";
import type { CronFormState } from "../ui-types";

export type CronProps = {
  loading: boolean;
  status: CronStatus | null;
  jobs: CronJob[];
  error: string | null;
  busy: boolean;
  form: CronFormState;
  channels: string[];
  editingJobId: string | null;
  selectedJobId: string | null;
  runs: CronRunLogEntry[];
  lastUpdatedMs: number | null;
  filter: string;
  filterType: "all" | "enabled" | "disabled";
  onFormChange: (patch: Partial<CronFormState>) => void;
  onSubmit: () => void;
  onToggle: (job: CronJob, enabled: boolean) => void;
  onRun: (job: CronJob) => void;
  onRemove: (job: CronJob) => void;
  onEdit: (job: CronJob) => void;
  onSelectJob: (job: CronJob) => void;
  onLoadRuns: (jobId: string) => void;
  onRefresh: () => void;
  onCloseModal: () => void;
  onFilterChange: (filter: string) => void;
  onFilterTypeChange: (type: "all" | "enabled" | "disabled") => void;
};

export function renderCron(props: CronProps) {
  const selectedJob = props.selectedJobId
    ? props.jobs.find((j) => j.id === props.selectedJobId) ?? null
    : null;

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

  const editingJob = props.editingJobId
    ? props.jobs.find((j) => j.id === props.editingJobId)
    : null;

  return html`
    <section class="cron-layout">
      <div class="cron-main">
        ${renderSchedulerStatus({
          status: props.status,
          loading: props.loading,
          lastUpdatedMs: props.lastUpdatedMs,
          onRefresh: props.onRefresh,
        })}

        <div class="card cron-job-card">
          <div class="cron-header">
            <div>
              <div class="card-title">Scheduled Jobs</div>
              <div class="card-sub">Manage your automated tasks</div>
            </div>
            <button class="btn btn-primary" @click=${() => props.onEdit({} as CronJob)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Job
            </button>
          </div>

          <div class="cron-filter-bar">
            <div class="cron-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search jobs..."
                .value=${props.filter}
                @input=${(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  props.onFilterChange(target.value);
                }}
              />
            </div>
            <div class="cron-tabs">
              <button
                class="cron-tab ${props.filterType === "all" ? "active" : ""}"
                @click=${() => props.onFilterTypeChange("all")}
              >
                All (${props.jobs.length})
              </button>
              <button
                class="cron-tab ${props.filterType === "enabled" ? "active" : ""}"
                @click=${() => props.onFilterTypeChange("enabled")}
              >
                Enabled (${props.jobs.filter((j) => j.enabled).length})
              </button>
              <button
                class="cron-tab ${props.filterType === "disabled" ? "active" : ""}"
                @click=${() => props.onFilterTypeChange("disabled")}
              >
                Disabled (${props.jobs.filter((j) => !j.enabled).length})
              </button>
            </div>
          </div>

          ${filteredJobs.length === 0
            ? html`<div class="cron-empty">
                ${props.jobs.length === 0
                  ? html`<div class="cron-empty-message">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <div>No jobs configured yet</div>
                      <div class="muted">Create your first scheduled task to get started</div>
                    </div>`
                  : html`<div class="cron-empty-message">No matching jobs</div>`}
              </div>`
            : html`<div class="cron-job-table">
                <div class="cron-job-header">
                  <div class="cron-job-cell cron-job-cell-name">Job</div>
                  <div class="cron-job-cell cron-job-cell-status">Status</div>
                  <div class="cron-job-cell cron-job-cell-target">Target</div>
                  <div class="cron-job-cell cron-job-cell-payload">Payload</div>
                  <div class="cron-job-cell cron-job-cell-actions">Actions</div>
                </div>
                ${filteredJobs.map((job) =>
                  renderCronJobRow({
                    job,
                    selected: props.selectedJobId === job.id,
                    busy: props.busy,
                    onClick: () => props.onSelectJob(job),
                    onToggle: props.onToggle,
                    onRun: props.onRun,
                    onRemove: props.onRemove,
                  })
                )}
              </div>`}
        </div>
      </div>

      ${renderCronHistoryPanel({
        open: props.selectedJobId !== null,
        job: selectedJob,
        runs: props.runs,
        onLoadRuns: props.onLoadRuns,
        onClose: () => props.onLoadRuns(""),
      })}

      ${renderCronEditModal({
        open: props.editingJobId !== null,
        job: editingJob,
        form: props.form,
        busy: props.busy,
        channels: props.channels,
        error: props.error,
        onFormChange: props.onFormChange,
        onSubmit: props.onSubmit,
        onClose: props.onCloseModal,
      })}
    </section>
  `;
}
