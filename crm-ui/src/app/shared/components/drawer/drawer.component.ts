import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="drawer-backdrop" (click)="closed.emit()" aria-hidden="true"></div>
      <aside class="drawer" [attr.aria-labelledby]="'drawer-title-' + _id" role="dialog" aria-modal="true">
        <div class="drawer__header">
          <h2 class="drawer__title" [id]="'drawer-title-' + _id">{{ title() }}</h2>
          <button class="drawer__close" (click)="closed.emit()" aria-label="Close drawer">×</button>
        </div>
        <div class="drawer__body">
          <ng-content />
        </div>
      </aside>
    }
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100;
    }
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: var(--drawer-width); background: var(--color-surface);
      box-shadow: var(--shadow-lg); z-index: 101;
      display: flex; flex-direction: column;
      animation: slideIn var(--duration-slow) var(--easing-default);
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: none; } }
    .drawer__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }
    .drawer__title { font-size: var(--font-size-md); }
    .drawer__close { background: none; border: none; font-size: var(--font-size-lg); cursor: pointer; color: var(--color-text-secondary); }
    .drawer__close:hover { color: var(--color-text-primary); }
    .drawer__body { flex: 1; overflow-y: auto; padding: var(--space-6); }
  `]
})
export class DrawerComponent {
  readonly _id = Math.random().toString(36).slice(2);
  readonly open = input(false);
  readonly title = input('');
  readonly closed = output<void>();
}
