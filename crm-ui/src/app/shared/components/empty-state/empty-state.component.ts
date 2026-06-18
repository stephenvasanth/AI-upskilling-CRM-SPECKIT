import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="empty-state">
      <div class="empty-state__icon" aria-hidden="true">{{ icon() }}</div>
      <h3 class="empty-state__heading">{{ heading() }}</h3>
      <p class="empty-state__subtext">{{ subtext() }}</p>
      @if (ctaLabel()) {
        <app-button (click)="ctaClick.emit()">{{ ctaLabel() }}</app-button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: var(--space-12) var(--space-8); text-align: center; gap: var(--space-3);
    }
    .empty-state__icon { font-size: 48px; opacity: 0.3; }
    .empty-state__heading { font-size: var(--font-size-md); color: var(--color-text-primary); }
    .empty-state__subtext { color: var(--color-text-secondary); font-size: var(--font-size-sm); max-width: 300px; }
  `]
})
export class EmptyStateComponent {
  readonly icon = input('◌');
  readonly heading = input('Nothing here yet');
  readonly subtext = input('');
  readonly ctaLabel = input('');
  readonly ctaClick = output<void>();
}
