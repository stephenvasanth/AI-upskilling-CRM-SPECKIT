import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [ngClass]="'toast--' + toast.type" role="alert">
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: var(--space-4); right: var(--space-4);
      z-index: 9999; display: flex; flex-direction: column; gap: var(--space-2);
    }
    .toast {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-md); border-left: 4px solid;
      min-width: 280px; max-width: 400px;
      animation: slideDown var(--duration-normal) var(--easing-default);
    }
    @keyframes slideDown { from { transform: translateY(-8px); opacity: 0; } to { transform: none; opacity: 1; } }
    .toast--success { border-color: var(--color-success); }
    .toast--error { border-color: var(--color-danger); }
    .toast--info { border-color: var(--color-info); }
    .toast__message { flex: 1; font-size: var(--font-size-sm); color: var(--color-text-primary); }
    .toast__close { background: none; border: none; color: var(--color-text-secondary); cursor: pointer; font-size: var(--font-size-md); padding: 0; }
    .toast__close:hover { color: var(--color-text-primary); }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
