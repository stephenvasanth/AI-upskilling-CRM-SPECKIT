import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { DealDto, DealStage, STAGE_LABELS } from '../deals.service';
import { DealCardComponent } from '../deal-card/deal-card.component';

@Component({
  selector: 'app-deal-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, DealCardComponent],
  template: `
    <div class="deal-column">
      <div class="deal-column__header">
        <span class="deal-column__stage-name">{{ stageLabel() }}</span>
        <span class="deal-column__meta">
          {{ deals().length }} · {{ totalValue() }}
        </span>
      </div>
      <div
        class="deal-column__list"
        cdkDropList
        [id]="'col-' + stage()"
        [cdkDropListData]="deals()"
        [cdkDropListConnectedTo]="connectedTo()"
        (cdkDropListDropped)="dropped.emit($event)"
      >
        @for (deal of deals(); track deal.id) {
          <app-deal-card [deal]="deal" (cardClick)="cardClick.emit($event)" />
        }
        @if (deals().length === 0) {
          <div class="deal-column__empty">Drop cards here</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .deal-column { display: flex; flex-direction: column; min-width: 220px; max-width: 260px; flex: 1; }
    .deal-column__header { padding: var(--space-3) var(--space-2); margin-bottom: var(--space-2); }
    .deal-column__stage-name { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); display: block; }
    .deal-column__meta { font-size: var(--font-size-xs); color: var(--color-text-secondary); display: block; margin-top: 2px; }
    .deal-column__list { flex: 1; display: flex; flex-direction: column; gap: var(--space-2); background: var(--color-background); border-radius: var(--radius-md); padding: var(--space-2); min-height: 80px; }
    .deal-column__empty { padding: var(--space-4); text-align: center; font-size: var(--font-size-xs); color: var(--color-text-disabled); border: 2px dashed var(--color-border); border-radius: var(--radius-md); }
    :host ::ng-deep .cdk-drag-placeholder { opacity: 0.3; }
    :host ::ng-deep .cdk-drag-animating { transition: transform 200ms ease; }
  `]
})
export class DealColumnComponent {
  readonly stage = input.required<DealStage>();
  readonly deals = input<DealDto[]>([]);
  readonly connectedTo = input<string[]>([]);

  readonly dropped = output<import('@angular/cdk/drag-drop').CdkDragDrop<DealDto[]>>();
  readonly cardClick = output<DealDto>();

  readonly stageLabel = computed(() => STAGE_LABELS[this.stage()]);

  readonly totalValue = computed(() => {
    const sum = this.deals().reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    return '$' + sum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  });
}
