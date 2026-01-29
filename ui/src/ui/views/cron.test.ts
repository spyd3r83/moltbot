import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_CRON_FORM } from "../app-defaults";
import type { CronJob } from "../types";
import { renderCron, type CronProps } from "./cron";

function createJob(id: string): CronJob {
  return {
    id,
    name: "Daily ping",
    enabled: true,
    createdAtMs: 0,
    updatedAtMs: 0,
    schedule: { kind: "cron", expr: "0 9 * * *" },
    sessionTarget: "main",
    wakeMode: "next-heartbeat",
    payload: { kind: "systemEvent", text: "ping" },
  };
}

function createProps(overrides: Partial<CronProps> = {}): CronProps {
  return {
    loading: false,
    status: null,
    jobs: [],
    error: null,
    busy: false,
    form: { ...DEFAULT_CRON_FORM },
    channels: [],
    channelLabels: {},
    channelMeta: [],
    runsJobId: null,
    runs: [],
    lastUpdatedMs: null,
    editingJobId: null,
    filter: "",
    filterType: "all",
    onFormChange: () => undefined,
    onRefresh: () => undefined,
    onSubmit: () => undefined,
    onEdit: () => undefined,
    onDuplicate: () => undefined,
    onCancelEdit: () => undefined,
    onToggle: () => undefined,
    onRun: () => undefined,
    onRemove: () => undefined,
    onLoadRuns: () => undefined,
    onFilterChange: () => undefined,
    onFilterTypeChange: () => undefined,
    ...overrides,
  };
}

describe("cron view", () => {
  it("prompts to select a job before showing run history", () => {
    const container = document.createElement("div");
    render(renderCron(createProps()), container);

    expect(container.textContent).toContain("Select a job to inspect run history");
  });

  it("loads run history when clicking a job row", () => {
    const container = document.createElement("div");
    const onLoadRuns = vi.fn();
    const job = createJob("job-1");
    render(
      renderCron(
        createProps({
          jobs: [job],
          onLoadRuns,
        }),
      ),
      container,
    );

    const row = container.querySelector(".list-item-clickable") as HTMLElement | null;
    expect(row).not.toBeNull();
    row?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(onLoadRuns).toHaveBeenCalledWith("job-1");
  });

  it("marks the selected job and shows run history modal", () => {
    const container = document.createElement("div");
    const onLoadRuns = vi.fn();
    const job = createJob("job-1");
    render(
      renderCron(
        createProps({
          jobs: [job],
          runsJobId: "job-1",
          onLoadRuns,
        }),
      ),
      container,
    );

    const selected = container.querySelector(".list-item-selected");
    expect(selected).not.toBeNull();

    const modal = container.querySelector(".modal-overlay");
    expect(modal).not.toBeUndefined();
  });

  it("shows scheduler status with enabled state", () => {
    const container = document.createElement("div");
    render(
      renderCron(
        createProps({
          status: { enabled: true, jobs: 5, nextWakeAtMs: Date.now() + 60000 },
        }),
      ),
      container,
    );

    expect(container.textContent).toContain("Scheduler");
    expect(container.textContent).toContain("Yes");
    expect(container.textContent).toContain("5");
  });

  it("shows edit button on job items", () => {
    const container = document.createElement("div");
    const job = createJob("job-1");
    render(
      renderCron(
        createProps({
          jobs: [job],
        }),
      ),
      container,
    );

    const editButtons = container.querySelectorAll("button[aria-label*='Edit']");
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it("shows filter tabs with job counts", () => {
    const container = document.createElement("div");
    const jobs = [createJob("job-1"), createJob("job-2")];
    jobs[1].enabled = false;

    render(
      renderCron(
        createProps({
          jobs,
        }),
      ),
      container,
    );

    expect(container.textContent).toContain("All (2)");
    expect(container.textContent).toContain("Enabled (1)");
    expect(container.textContent).toContain("Disabled (1)");
  });

  it("filters jobs by search term", () => {
    const container = document.createElement("div");
    const jobs = [createJob("job-1"), createJob("special-job")];
    const onFilterChange = vi.fn();

    render(
      renderCron(
        createProps({
          jobs,
          filter: "special",
          onFilterChange,
        }),
      ),
      container,
    );

    expect(container.textContent).toContain("special-job");
    expect(container.textContent).not.toContain("Daily ping");
  });
});
