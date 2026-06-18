import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { DealDto } from '../deals.service';

@Component({
  selector: 'app-deal-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDrag],
  template: `
    <div
      class="deal-card"
      [class.deal-card--muted]="deal().stage === 'CLOSED_LOST'"
      cdkDrag
      [cdkDragData]="deal()"
      (click)="cardClick.emit(deal())"
    >
      <div class="deal-card__drag-handle" cdkDragHandle>⋮⋮</div>
      <div class="deal-card__body">
        <p class="deal-card__title">{{ deal().title }}</p>
        @if (deal().value) {
          <p class="deal-card__value">{{ formatValue(deal().value) }}</p>
        }
        @if (deal().contactName) {
          <p class="deal-card__contact">{{ deal().contactName }}</p>
        }
        @if (deal().expectedCloseDate) {
          <p class="deal-card__close-date">Close: {{ deal().expectedCloseDate }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .deal-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      cursor: pointer;
      transition: box-shadow var(--duration-fast), opacity var(--duration-fast);
      position: relative;
      display: flex;
      gap: var(--space-2);
    }
    .deal-card:hover { box-shadow: var(--shadow-md); }
    .deal-card--muted { opacity: 0.6; }
    .deal-card__drag-handle {
      color: var(--color-text-disabled);
      font-size: 10px;
      cursor: grab;
      letter-spacing: -2px;
      padding-top: 2px;
      flex-shrink: 0;
    }
    .deal-card__drag-handle:active { cursor: grabbing; }
    .deal-card__body { flex: 1; min-width: 0; }
    .deal-card__title { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); margin-bottom: var(--space-1); word-break: break-word; }
    .deal-card__value { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-primary); }
    .deal-card__contact { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 2px; }
    .deal-card__close-date { font-size: var(--font-size-xs); color: var(--color-text-disabled); margin-top: 2px; }
  `]
})
export class DealCardComponent {
  readonly deal = input.required<DealDto>();
  readonly cardClick = output<DealDto>();

  formatValue(value: number): string {
    return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
