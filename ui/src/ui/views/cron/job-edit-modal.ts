import { html, nothing } from "lit";
import type { CronJob, CronRunLogEntry } from "../../types";
import type { CronFormState } from "../../ui-types";

export type CronEditModalProps = {
  open: boolean;
  job: CronJob | null;
  form: CronFormState;
  busy: boolean;
  channels: string[];
  error: string | null;
  onFormChange: (patch: Partial<CronFormState>) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function renderCronEditModal(props: CronEditModalProps) {
  if (!props.open || !props.job) return nothing;

  const isEditing = props.job !== null;
  const title = isEditing ? `Edit: ${props.job.name}` : "New Job";

  return html`
    <div class="modal-overlay" @click=${props.onClose}>
      <div class="modal-content cron-edit-modal" @click=${(e: Event) => e.stopPropagation()}>
        <div class="modal-header">
          <h3 class="card-title">${title}</h3>
          <button class="modal-close" @click=${props.onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body cron-edit-body">
          ${props.error ? html`<div class="callout danger">${props.error}</div>` : nothing}
          
          <div class="form-section">
            <label class="field">
              <span>Job Name</span>
              <input
                type="text"
                .value=${props.form.name}
                @input=${(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  props.onFormChange({ name: target.value });
                }}
                placeholder="My daily backup"
              />
            </label>
            
            <label class="field">
              <span>Description (optional)</span>
              <input
                type="text"
                .value=${props.form.description}
                @input=${(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  props.onFormChange({ description: target.value });
                }}
                placeholder="What this job does"
              />
            </label>

            <label class="field">
              <span>Agent ID (optional)</span>
              <input
                type="text"
                .value=${props.form.agentId}
                @input=${(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  props.onFormChange({ agentId: target.value });
                }}
                placeholder="main"
              />
            </label>

            <label class="field">
              <span>Enabled</span>
              <input
                type="checkbox"
                .checked=${props.form.enabled}
                @change=${(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  props.onFormChange({ enabled: target.checked });
                }}
              />
            </label>
          </div>

          <div class="form-section">
            <h4>Schedule</h4>
            <div class="form-grid">
              <label class="field">
                <span>Schedule Type</span>
                <select
                  .value=${props.form.scheduleKind}
                  @change=${(e: Event) => {
                    const target = e.target as HTMLSelectElement;
                    props.onFormChange({ scheduleKind: target.value as any });
                  }}
                >
                  <option value="every">Every</option>
                  <option value="at">At</option>
                  <option value="cron">Cron Expression</option>
                </select>
              </label>

              ${props.form.scheduleKind === "every" ? html`
                <label class="field">
                  <span>Amount</span>
                  <input
                    type="number"
                    .value=${props.form.everyAmount}
                    @input=${(e: Event) => {
                      const target = e.target as HTMLInputElement;
                      props.onFormChange({ everyAmount: target.value });
                    }}
                    min="1"
                  />
                </label>
                <label class="field">
                  <span>Unit</span>
                  <select
                    .value=${props.form.everyUnit}
                    @change=${(e: Event) => {
                      const target = e.target as HTMLSelectElement;
                      props.onFormChange({ everyUnit: target.value as any });
                    }}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </label>
              ` : nothing}

              ${props.form.scheduleKind === "at" ? html`
                <label class="field">
                  <span>Run At</span>
                  <input
                    type="datetime-local"
                    .value=${props.form.scheduleAt}
                    @input=${(e: Event) => {
                      const target = e.target as HTMLInputElement;
                      props.onFormChange({ scheduleAt: target.value });
                    }}
                  />
                </label>
              ` : nothing}

              ${props.form.scheduleKind === "cron" ? html`
                <label class="field">
                  <span>Cron Expression</span>
                  <input
                    type="text"
                    .value=${props.form.cronExpr}
                    @input=${(e: Event) => {
                      const target = e.target as HTMLInputElement;
                      props.onFormChange({ cronExpr: target.value });
                    }}
                    placeholder="0 9 * * 1-5"
                  />
                </label>
                <label class="field">
                  <span>Timezone (optional)</span>
                  <input
                    type="text"
                    .value=${props.form.cronTz}
                    @input=${(e: Event) => {
                      const target = e.target as HTMLInputElement;
                      props.onFormChange({ cronTz: target.value });
                    }}
                    placeholder="America/New_York"
                  />
                </label>
              ` : nothing}
            </div>
          </div>

          <div class="form-section">
            <h4>Session Settings</h4>
            <div class="form-grid">
              <label class="field">
                <span>Session Target</span>
                <select
                  .value=${props.form.sessionTarget}
                  @change=${(e: Event) => {
                    const target = e.target as HTMLSelectElement;
                    props.onFormChange({ sessionTarget: target.value as any });
                  }}
                >
                  <option value="main">Main</option>
                  <option value="isolated">Isolated</option>
                </select>
              </label>

              <label class="field">
                <span>Wake Mode</span>
                <select
                  .value=${props.form.wakeMode}
                  @change=${(e: Event) => {
                    const target = e.target as HTMLSelectElement;
                    props.onFormChange({ wakeMode: target.value as any });
                  }}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </label>

              ${props.form.sessionTarget === "isolated" ? html`
                <label class="field">
                  <span>Post to Main Prefix</span>
                  <input
                    type="text"
                    .value=${props.form.postToMainPrefix}
                    @input=${(e: Event) => {
                      const target = e.target as HTMLInputElement;
                      props.onFormChange({ postToMainPrefix: target.value });
                    }}
                    placeholder="/cron-result"
                  />
                </label>
              ` : nothing}
            </div>
          </div>

          <div class="form-section">
            <h4>Payload</h4>
            <div class="form-grid">
              <label class="field">
                <span>Payload Type</span>
                <select
                  .value=${props.form.payloadKind}
                  @change=${(e: Event) => {
                    const target = e.target as HTMLSelectElement;
                    props.onFormChange({ payloadKind: target.value as any });
                  }}
                >
                  <option value="agentTurn">Agent Turn</option>
                  <option value="systemEvent">System Event</option>
                </select>
              </label>

              <label class="field">
                <span>${props.form.payloadKind === "systemEvent" ? "Event Text" : "Message"}</span>
                <textarea
                  .value=${props.form.payloadText}
                  @input=${(e: Event) => {
                    const target = e.target as HTMLTextAreaElement;
                    props.onFormChange({ payloadText: target.value });
                  }}
                  placeholder="${props.form.payloadKind === 'systemEvent' ? 'System message' : 'Agent prompt'}"
                  rows="3"
                ></textarea>
              </label>

              ${props.form.payloadKind === "agentTurn" ? html`
                <label class="field">
                  <input
                    type="checkbox"
                    .checked=${props.form.deliver}
                    @change=${(e: Event) => {
                      const target = e.target as HTMLInputElement;
                      props.onFormChange({ deliver: target.checked });
                    }}
                  />
                  <span>Deliver to channel</span>
                </label>

                <label class="field">
                  <span>Channel</span>
                  <select
                    .value=${props.form.channel}
                    @change=${(e: Event) => {
                      const target = e.target as HTMLSelectElement;
                      props.onFormChange({ channel: target.value });
                    }}
                  >
                    ${props.channels.map(ch => html`<option value="${ch}">${ch}</option>`)}
                  </select>
                </label>

                <label class="field">
                  <span>To (optional)</span>
                  <input
                    type="text"
                    .value=${props.form.to}
                    @input=${(e: Event) => {
                      const target = e.target as HTMLInputElement;
                      props.onFormChange({ to: target.value });
                    }}
                    placeholder="recipient"
                  />
                </label>

                <label class="field">
                  <span>Timeout (seconds, optional)</span>
                  <input
                    type="number"
                    .value=${props.form.timeoutSeconds}
                    @input=${(e: Event) => {
                      const target = e.target as HTMLInputElement;
                      props.onFormChange({ timeoutSeconds: target.value });
                    }}
                    min="0"
                  />
                </label>
              ` : nothing}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click=${props.onClose}>Cancel</button>
          <button class="btn btn-primary" ?disabled=${props.busy} @click=${props.onSubmit}>
            ${isEditing ? "Update Job" : "Create Job"}
          </button>
        </div>
      </div>
    </div>
  `;
}
