import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { NgClass } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [ngClass]="['btn', 'btn--' + variant(), loading() ? 'btn--loading' : '']"
    >
      @if (loading()) {
        <span class="btn__spinner" aria-hidden="true"></span>
      }
      <ng-content />
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      height: 40px;
      padding: 0 var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: background-color var(--duration-fast) var(--easing-default),
                  opacity var(--duration-fast) var(--easing-default);
      white-space: nowrap;
    }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn--primary { background: var(--color-primary); color: #fff; border: none; }
    .btn--primary:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn--secondary { background: var(--color-surface); color: var(--color-text-primary); border: 1px solid var(--color-border); }
    .btn--secondary:hover:not(:disabled) { background: var(--color-background); }
    .btn--danger { background: var(--color-danger); color: #fff; border: none; }
    .btn--danger:hover:not(:disabled) { background: #dc2626; }
    .btn--ghost { background: transparent; color: var(--color-text-secondary); border: none; }
    .btn--ghost:hover:not(:disabled) { color: var(--color-text-primary); background: var(--color-background); }
    .btn__spinner {
      width: 16px; height: 16px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
}
