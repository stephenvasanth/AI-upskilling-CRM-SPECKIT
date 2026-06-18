import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="metric-card">
      <span class="metric-card__label">{{ label() }}</span>
      @if (value() == null || value() === 0) {
        <span class="metric-card__value metric-card__value--empty">0</span>
        <span class="metric-card__empty">No data yet</span>
      } @else {
        <span class="metric-card__value">{{ displayValue() }}</span>
      }
    </div>
  `,
  styles: [`
    .metric-card {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .metric-card__label {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-card__value {
      font-size: 2rem;
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: 1;
    }
    .metric-card__value--empty { color: var(--color-text-disabled); }
    .metric-card__empty { font-size: var(--font-size-xs); color: var(--color-text-disabled); }
  `]
})
export class MetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input<number | null>(null);
  readonly prefix = input<string>('');
  readonly suffix = input<string>('');
  readonly format = input<'number' | 'currency'>('number');

  displayValue(): string {
    const v = this.value();
    if (v == null) return '0';
    if (this.format() === 'currency') {
      return this.prefix() + new Intl.NumberFormat('en-GB', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(v) + this.suffix();
    }
    return this.prefix() + String(v) + this.suffix();
  }
}
