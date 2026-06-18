import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { StageCountDto } from '../dashboard.service';

const STAGE_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
};

const STAGE_COLORS: Record<string, string> = {
  LEAD: '#6366f1',
  QUALIFIED: '#8b5cf6',
  PROPOSAL: '#06b6d4',
  NEGOTIATION: '#f59e0b',
  CLOSED_WON: '#10b981',
};

@Component({
  selector: 'app-pipeline-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pipeline">
      @if (stages().length === 0) {
        <p class="pipeline__empty">No open deals in the pipeline.</p>
      } @else {
        @for (stage of stages(); track stage.stage) {
          <div class="pipeline__row">
            <span class="pipeline__label">{{ stageLabel(stage.stage) }}</span>
            <div class="pipeline__bar-track">
              <div
                class="pipeline__bar"
                [style.width.%]="barWidth(stage.count)"
                [style.background]="stageColor(stage.stage)"
              ></div>
            </div>
            <span class="pipeline__count">{{ stage.count }}</span>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .pipeline { display: flex; flex-direction: column; gap: var(--space-3); }
    .pipeline__empty { font-size: var(--font-size-sm); color: var(--color-text-disabled); text-align: center; padding: var(--space-4) 0; }
    .pipeline__row { display: grid; grid-template-columns: 100px 1fr 32px; align-items: center; gap: var(--space-3); }
    .pipeline__label { font-size: var(--font-size-xs); color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pipeline__bar-track { height: 8px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden; }
    .pipeline__bar { height: 100%; border-radius: var(--radius-full); transition: width 0.3s ease; min-width: 4px; }
    .pipeline__count { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); text-align: right; }

    @media (prefers-reduced-motion: reduce) {
      .pipeline__bar { transition: none; }
    }
  `]
})
export class PipelineSummaryComponent {
  readonly data = input<StageCountDto[]>([]);

  readonly stages = computed(() =>
    this.data().filter(s => s.stage !== 'CLOSED_LOST' && s.stage !== 'CLOSED_WON')
      .concat(this.data().filter(s => s.stage === 'CLOSED_WON'))
  );

  readonly maxCount = computed(() => Math.max(...this.stages().map(s => s.count), 1));

  barWidth(count: number): number {
    return Math.round((count / this.maxCount()) * 100);
  }

  stageLabel(stage: string): string {
    return STAGE_LABELS[stage] ?? stage;
  }

  stageColor(stage: string): string {
    return STAGE_COLORS[stage] ?? '#94a3b8';
  }
}
