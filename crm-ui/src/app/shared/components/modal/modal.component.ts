import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="cancel.emit()" aria-hidden="true"></div>
      <div class="modal" role="dialog" [attr.aria-labelledby]="'modal-title-' + _id" aria-modal="true">
        <h2 class="modal__title" [id]="'modal-title-' + _id">{{ title() }}</h2>
        <p class="modal__body">{{ message() }}</p>
        <div class="modal__actions">
          <app-button variant="secondary" (click)="cancel.emit()">{{ cancelLabel() }}</app-button>
          <app-button [variant]="confirmVariant()" (click)="confirm.emit()">{{ confirmLabel() }}</app-button>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      backdrop-filter: blur(2px); z-index: 100;
    }
    .modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      z-index: 101; background: var(--color-surface); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg); padding: var(--space-6); max-width: 400px; width: 100%;
      animation: scaleIn var(--duration-normal) var(--easing-default);
    }
    @keyframes scaleIn { from { transform: translate(-50%,-50%) scale(0.95); opacity: 0; } }
    .modal__title { font-size: var(--font-size-md); margin-bottom: var(--space-2); }
    .modal__body { color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-6); }
    .modal__actions { display: flex; gap: var(--space-2); justify-content: flex-end; }
  `]
})
export class ModalComponent {
  readonly _id = Math.random().toString(36).slice(2);
  readonly open = input(false);
  readonly title = input('Confirm');
  readonly message = input('');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly confirmVariant = input<'danger' | 'primary'>('danger');

  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
