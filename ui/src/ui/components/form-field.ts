import { html, nothing, TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";

export type FieldProps = {
  label: string;
  error?: string | null;
  hint?: string | ReturnType<typeof html>;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  input?: TemplateResult;
};

export function renderField(props: FieldProps): TemplateResult {
  const containerStyle = props.fullWidth ? { gridColumn: "1 / -1" } : {};
  const errorId = props.error ? `error-${Math.random().toString(36).slice(2)}` : undefined;
  const hintId = props.hint ? `hint-${Math.random().toString(36).slice(2)}` : undefined;

  return html`
    <label
      class="field ${props.className ?? ""}"
      style=${styleMap(containerStyle)}
      aria-invalid=${props.error ? "true" : "false"}
      aria-describedby=${[errorId, hintId].filter(Boolean).join(" ") || nothing}
    >
      <span>
        ${props.label}
        ${props.required ? html`<span class="required" aria-hidden="true">*</span>` : nothing}
      </span>
      ${props.input ?? nothing}
      ${props.error
        ? html`<span class="field-error" id=${errorId} role="alert">${props.error}</span>`
        : nothing}
      ${props.hint && !props.error
        ? html`<span class="field-hint" id=${hintId}>${props.hint}</span>`
        : nothing}
    </label>
  `;
}
