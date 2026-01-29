import { html, nothing } from "lit";
import { formatAgo } from "../../format";
import { formatNextRun } from "../../presenter";
import { CRON_EXAMPLE_EXPRESSIONS, CRON_TIMEZONES, CRON_TOOLTIPS } from "../../constants/cron";
import { renderField } from "../../components/form-field";
import type { CronFormState } from "../../ui-types";
import type { CronJob } from "../../types";

export type CronFormProps = {
  form: CronFormState;
  channels: string[];
  channelLabels?: Record<string, string>;
  channelMeta?: Array<{ id: string; label?: string }>;
  error: string | null;
  busy: boolean;
  editingJobId: string | null;
  onFormChange: (patch: Partial<CronFormState>) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
};

function buildChannelOptions(props: CronFormProps): string[] {
  const options = ["last", ...props.channels.filter(Boolean)];
  const current = props.form.channel?.trim();
  if (current && !options.includes(current)) {
    options.push(current);
  }
  const seen = new Set<string>();
  return options.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function resolveChannelLabel(
  props: CronFormProps,
  channel: string,
): string {
  if (channel === "last") return "last";
  const meta = props.channelMeta?.find((entry) => entry.id === channel);
  if (meta?.label) return meta.label;
  return props.channelLabels?.[channel] ?? channel;
}

function validateForm(props: CronFormProps): Partial<Record<keyof CronFormState, string>> {
  const errors: Partial<Record<keyof CronFormState, string>> = {};

  if (!props.form.name.trim()) {
    errors.name = "Name is required";
  }

  if (props.form.scheduleKind === "at" && !props.form.scheduleAt) {
    errors.scheduleAt = "Run at time is required";
  }

  if (props.form.scheduleKind === "every") {
    const amount = Number(props.form.everyAmount);
    if (!props.form.everyAmount.trim() || isNaN(amount) || amount <= 0) {
      errors.everyAmount = "Valid interval required";
    }
  }

  if (props.form.scheduleKind === "cron" && !props.form.cronExpr.trim()) {
    errors.cronExpr = "Cron expression is required";
  }

  if (props.form.payloadKind === "systemEvent" && !props.form.payloadText.trim()) {
    errors.payloadText = "System event text is required";
  }

  if (props.form.payloadKind === "agentTurn" && !props.form.payloadText.trim()) {
    errors.payloadText = "Agent message is required";
  }

  if (props.form.deliver && !props.form.to.trim()) {
    errors.to = "Recipient required when delivery is enabled";
  }

  return errors;
}

function renderSchedulePreview(form: CronFormState): { text: string; className: string } {
  const schedule = form.scheduleKind;
  let text = "";
  let className = "";

  if (schedule === "at" && form.scheduleAt) {
    const date = new Date(form.scheduleAt);
    if (isNaN(date.getTime())) {
      text = "Invalid date/time";
      className = "error";
    } else {
      text = `Next run: ${date.toLocaleString()}`;
      className = "success";
    }
  } else if (schedule === "every") {
    const amount = Number(form.everyAmount);
    const unit = form.everyUnit;
    if (amount > 0) {
      text = `Every ${amount} ${unit}`;
      className = "success";
    } else {
      text = "Invalid interval";
      className = "error";
    }
  } else if (schedule === "cron" && form.cronExpr.trim()) {
    text = `Schedule: ${form.cronExpr}`;
    className = "success";
  } else {
    text = "Configure schedule to see preview";
    className = "";
  }

  return { text, className };
}

export function renderCronForm(props: CronFormProps) {
  const errors = validateForm(props);
  const preview = renderSchedulePreview(props.form);
  const channelOptions = buildChannelOptions(props);

  return html`
    <div class="card">
      <div class="card-title">${props.editingJobId ? "Edit Job" : "New Job"}</div>
      <div class="card-sub">
        ${props.editingJobId
          ? "Modify an existing scheduled job."
          : "Create a scheduled wakeup or agent run."}
      </div>
      ${props.editingJobId
        ? html`
            <div class="row" style="margin-top: 8px; margin-bottom: 12px;">
              <button class="btn secondary" @click=${props.onCancelEdit}>Cancel Edit</button>
            </div>
          `
        : nothing}

      <div class="form-grid" style="margin-top: 16px;">
        ${renderField({
          label: "Name",
          required: true,
          error: errors.name,
          hint: "Descriptive name for this job",
          input: html`
            <input
              type="text"
              .value=${props.form.name}
              @input=${(e: Event) =>
                props.onFormChange({ name: (e.target as HTMLInputElement).value })}
              placeholder="e.g., Daily morning check-in"
              aria-describedby="name-hint"
            />
          `,
        })}

        ${renderField({
          label: "Description",
          error: null,
          hint: "Optional notes about this job",
          input: html`
            <input
              type="text"
              .value=${props.form.description}
              @input=${(e: Event) =>
                props.onFormChange({ description: (e.target as HTMLInputElement).value })}
              placeholder="Optional description"
            />
          `,
        })}

        ${renderField({
          label: "Agent ID",
          error: null,
          hint: "Leave empty to use default agent",
          input: html`
            <input
              type="text"
              .value=${props.form.agentId}
              @input=${(e: Event) =>
                props.onFormChange({ agentId: (e.target as HTMLInputElement).value })}
              placeholder="default"
            />
          `,
        })}

        ${renderField({
          label: "Enabled",
          error: null,
          fullWidth: true,
          input: html`
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
              <input
                type="checkbox"
                id="enabled-toggle"
                .checked=${props.form.enabled}
                @change=${(e: Event) =>
                  props.onFormChange({ enabled: (e.target as HTMLInputElement).checked })}
                style="width: 18px; height: 18px; accent-color: var(--accent);"
              />
              <label for="enabled-toggle" style="font-size: 13px; color: var(--text);">
                Job is active and will run on schedule
              </label>
            </div>
          `,
        })}
      </div>

      <div style="margin-top: 20px; border-top: 1px solid var(--border); padding-top: 16px;">
        <div class="card-title" style="margin-bottom: 12px;">Schedule</div>

        <div class="form-grid">
          ${renderField({
            label: "Type",
            error: null,
            input: html`
              <select
                .value=${props.form.scheduleKind}
                @change=${(e: Event) =>
                  props.onFormChange({
                    scheduleKind: (e.target as HTMLSelectElement).value as CronFormState["scheduleKind"],
                  })}
              >
                <option value="every">Every (interval)</option>
                <option value="at">At (specific time)</option>
                <option value="cron">Cron (expression)</option>
              </select>
            `,
          })}
        </div>

        ${props.form.scheduleKind === "at"
          ? html`
              <div style="margin-top: 12px;">
                ${renderField({
                  label: "Run at",
                  required: true,
                  error: errors.scheduleAt,
                  input: html`
                    <input
                      type="datetime-local"
                      .value=${props.form.scheduleAt}
                      @input=${(e: Event) =>
                        props.onFormChange({
                          scheduleAt: (e.target as HTMLInputElement).value,
                        })}
                    />
                  `,
                })}
              </div>
            `
          : nothing}

        ${props.form.scheduleKind === "every"
          ? html`
              <div class="form-grid" style="margin-top: 12px;">
                ${renderField({
                  label: "Every",
                  required: true,
                  error: errors.everyAmount,
                  input: html`
                    <input
                      type="number"
                      min="1"
                      .value=${props.form.everyAmount}
                      @input=${(e: Event) =>
                        props.onFormChange({
                          everyAmount: (e.target as HTMLInputElement).value,
                        })}
                      placeholder="30"
                    />
                  `,
                })}
                ${renderField({
                  label: "Unit",
                  error: null,
                  input: html`
                    <select
                      .value=${props.form.everyUnit}
                      @change=${(e: Event) =>
                        props.onFormChange({
                          everyUnit: (e.target as HTMLSelectElement).value as CronFormState["everyUnit"],
                        })}
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  `,
                })}
              </div>
            `
          : nothing}

        ${props.form.scheduleKind === "cron"
          ? html`
              <div class="form-grid" style="margin-top: 12px;">
                ${renderField({
                  label: "Expression",
                  required: true,
                  error: errors.cronExpr,
                  hint: html`
                    <a
                      href="https://crontab.guru/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="color: var(--accent);"
                    >
                      Cron expression guide
                    </a>
                  `,
                  input: html`
                    <input
                      type="text"
                      .value=${props.form.cronExpr}
                      @input=${(e: Event) =>
                        props.onFormChange({ cronExpr: (e.target as HTMLInputElement).value })}
                      placeholder="0 9 * * *"
                      list="cron-examples"
                    />
                    <datalist id="cron-examples">
                      ${CRON_EXAMPLE_EXPRESSIONS.map(
                        (ex) => html`<option value="${ex.expr}">${ex.desc}</option>`,
                      )}
                    </datalist>
                  `,
                })}
                ${renderField({
                  label: "Timezone",
                  error: null,
                  hint: "Optional: defaults to local",
                  input: html`
                    <select
                      .value=${props.form.cronTz}
                      @change=${(e: Event) =>
                        props.onFormChange({
                          cronTz: (e.target as HTMLSelectElement).value,
                        })}
                    >
                      <option value="">Local</option>
                      ${CRON_TIMEZONES.map(
                        (tz) => html`<option value=${tz}>${tz}</option>`,
                      )}
                    </select>
                  `,
                })}
              </div>
            `
          : nothing}

        <div class="schedule-preview">
          <div class="schedule-preview__label">Schedule Preview</div>
          <div class="schedule-preview__value ${preview.className}">${preview.text}</div>
        </div>
      </div>

      <div style="margin-top: 20px; border-top: 1px solid var(--border); padding-top: 16px;">
        <div class="card-title" style="margin-bottom: 12px;">Action</div>

        <div class="form-grid">
          ${renderField({
            label: "Session",
            error: null,
            hint: CRON_TOOLTIPS.sessionTarget.main,
            input: html`
              <select
                .value=${props.form.sessionTarget}
                @change=${(e: Event) =>
                  props.onFormChange({
                    sessionTarget: (e.target as HTMLSelectElement).value as CronFormState["sessionTarget"],
                  })}
              >
                <option value="main">Main</option>
                <option value="isolated">Isolated</option>
              </select>
            `,
          })}
          ${renderField({
            label: "Wake mode",
            error: null,
            hint: CRON_TOOLTIPS.wakeMode["next-heartbeat"],
            input: html`
              <select
                .value=${props.form.wakeMode}
                @change=${(e: Event) =>
                  props.onFormChange({
                    wakeMode: (e.target as HTMLSelectElement).value as CronFormState["wakeMode"],
                  })}
              >
                <option value="next-heartbeat">Next heartbeat</option>
                <option value="now">Now</option>
              </select>
            `,
          })}
          ${renderField({
            label: "Payload type",
            error: null,
            input: html`
              <select
                .value=${props.form.payloadKind}
                @change=${(e: Event) =>
                  props.onFormChange({
                    payloadKind: (e.target as HTMLSelectElement).value as CronFormState["payloadKind"],
                  })}
              >
                <option value="systemEvent">System event</option>
                <option value="agentTurn">Agent turn</option>
              </select>
            `,
          })}
        </div>

        <div style="margin-top: 12px;">
          ${renderField({
            label: props.form.payloadKind === "systemEvent" ? "System text" : "Agent message",
            required: true,
            error: errors.payloadText,
            input: html`
              <textarea
                .value=${props.form.payloadText}
                @input=${(e: Event) =>
                  props.onFormChange({
                    payloadText: (e.target as HTMLTextAreaElement).value,
                  })}
                rows="4"
                placeholder=${props.form.payloadKind === "systemEvent"
                  ? "e.g., trigger-daily-report"
                  : "Message to send to the agent"}
              ></textarea>
            `,
          })}
        </div>

        ${props.form.payloadKind === "agentTurn"
          ? html`
              <div class="form-grid" style="margin-top: 12px;">
                ${renderField({
                  label: "Deliver response",
                  error: null,
                  hint: CRON_TOOLTIPS.deliver,
                  input: html`
                    <div
                      style="display: flex; align-items: center; gap: 8px; padding: 8px 0;"
                    >
                      <input
                        type="checkbox"
                        id="deliver-toggle"
                        .checked=${props.form.deliver}
                        @change=${(e: Event) =>
                          props.onFormChange({
                            deliver: (e.target as HTMLInputElement).checked,
                          })}
                        style="width: 18px; height: 18px; accent-color: var(--accent);"
                      />
                      <label for="deliver-toggle" style="font-size: 13px; color: var(--text);">
                        Deliver response back to channel
                      </label>
                    </div>
                  `,
                })}
                ${renderField({
                  label: "Channel",
                  error: null,
                  input: html`
                    <select
                      .value=${props.form.channel || "last"}
                      @change=${(e: Event) =>
                        props.onFormChange({
                          channel: (e.target as HTMLSelectElement).value as CronFormState["channel"],
                        })}
                    >
                      ${channelOptions.map(
                        (channel) =>
                          html`<option value=${channel}>
                            ${resolveChannelLabel(props, channel)}
                          </option>`,
                      )}
                    </select>
                  `,
                })}
                ${renderField({
                  label: "To",
                  error: errors.to,
                  hint: "Phone number or chat ID",
                  input: html`
                    <input
                      type="text"
                      .value=${props.form.to}
                      @input=${(e: Event) =>
                        props.onFormChange({ to: (e.target as HTMLInputElement).value })}
                      placeholder="+1555… or chat id"
                    />
                  `,
                })}
                ${renderField({
                  label: "Timeout (seconds)",
                  error: null,
                  input: html`
                    <input
                      type="number"
                      min="1"
                      .value=${props.form.timeoutSeconds}
                      @input=${(e: Event) =>
                        props.onFormChange({
                          timeoutSeconds: (e.target as HTMLInputElement).value,
                        })}
                      placeholder="300"
                    />
                  `,
                })}
              </div>

              ${props.form.sessionTarget === "isolated"
                ? html`
                    <div style="margin-top: 12px;">
                      ${renderField({
                        label: "Post to main prefix",
                        error: null,
                        hint: "Optional prefix for messages posted to main session",
                        input: html`
                          <input
                            type="text"
                            .value=${props.form.postToMainPrefix}
                            @input=${(e: Event) =>
                              props.onFormChange({
                                postToMainPrefix: (e.target as HTMLInputElement).value,
                              })}
                            placeholder="[Cron] "
                          />
                        `,
                      })}
                    </div>
                  `
                : nothing}
            `
          : nothing}
      </div>

      ${props.error
        ? html`<div class="error-banner" role="alert" style="margin-top: 16px;">${props.error}</div>`
        : nothing}

      <div class="row" style="margin-top: 16px;">
        <button
          class="btn primary"
          ?disabled=${props.busy || Object.keys(errors).length > 0}
          @click=${props.onSubmit}
        >
          ${props.busy
            ? "Saving…"
            : props.editingJobId
              ? "Update job"
              : "Add job"}
        </button>
      </div>
    </div>
  `;
}
