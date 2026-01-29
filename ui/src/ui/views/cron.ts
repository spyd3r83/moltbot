import { html, nothing } from "lit";
import { renderCronForm, renderSchedulerStatus, renderJobList, renderRunHistory } from "./cron/index";
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
  channelLabels?: Record<string, string>;
  channelMeta?: Array<{ id: string; label?: string }>;
  runsJobId: string | null;
  runs: CronRunLogEntry[];
  lastUpdatedMs: number | null;
  editingJobId: string | null;
  filter: string;
  filterType: "all" | "enabled" | "disabled";
  onFormChange: (patch: Partial<CronFormState>) => void;
  onRefresh: () => void;
  onSubmit: () => void;
  onEdit: (job: CronJob) => void;
  onDuplicate: (job: CronJob) => void;
  onCancelEdit: () => void;
  onToggle: (job: CronJob, enabled: boolean) => void;
  onRun: (job: CronJob) => void;
  onRemove: (job: CronJob) => void;
  onLoadRuns: (jobId: string) => void;
  onFilterChange: (filter: string) => void;
  onFilterTypeChange: (type: "all" | "enabled" | "disabled") => void;
};

export function renderCron(props: CronProps) {
  const selectedJob = props.runsJobId
    ? props.jobs.find((j) => j.id === props.runsJobId) ?? null
    : null;

  return html`
    <section class="grid grid-cols-2">
      ${renderSchedulerStatus({
        status: props.status,
        loading: props.loading,
        lastUpdatedMs: props.lastUpdatedMs,
        onRefresh: props.onRefresh,
      })}

      ${renderCronForm({
        form: props.form,
        channels: props.channels,
        channelLabels: props.channelLabels,
        channelMeta: props.channelMeta,
        error: props.error,
        busy: props.busy,
        editingJobId: props.editingJobId,
        onFormChange: props.onFormChange,
        onSubmit: props.onSubmit,
        onCancelEdit: props.onCancelEdit,
      })}
    </section>

    ${renderJobList({
      jobs: props.jobs,
      runsJobId: props.runsJobId,
      busy: props.busy,
      filter: props.filter,
      filterType: props.filterType,
      onLoadRuns: props.onLoadRuns,
      onEdit: props.onEdit,
      onDuplicate: props.onDuplicate,
      onToggle: props.onToggle,
      onRun: props.onRun,
      onRemove: props.onRemove,
      onFilterChange: props.onFilterChange,
      onFilterTypeChange: props.onFilterTypeChange,
    })}

    ${renderRunHistory({
      open: props.runsJobId !== null,
      job: selectedJob,
      runs: props.runs,
      onClose: () => props.onLoadRuns(""),
    })}
  `;
}
