import { html, nothing } from "lit";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function renderConfirmDialog(props: ConfirmDialogProps): ReturnType<typeof html> {
  if (!props.open) return nothing;

  return html`
    <div class="modal-overlay" @click=${props.onCancel}>
      <div class="modal-content confirm-dialog" @click=${(e: Event) => e.stopPropagation()}>
        <div class="modal-header">
          <h3 class="card-title">${props.title}</h3>
        </div>
        <div class="modal-body">
          <p>${props.message}</p>
        </div>
        <div class="modal-actions">
          <button class="btn" @click=${props.onCancel}>
            ${props.cancelLabel ?? "Cancel"}
          </button>
          <button
            class="btn ${props.danger ? "danger" : "primary"}"
            @click=${props.onConfirm}
          >
            ${props.confirmLabel ?? (props.danger ? "Delete" : "Confirm")}
          </button>
        </div>
      </div>
    </div>
  `;
}
