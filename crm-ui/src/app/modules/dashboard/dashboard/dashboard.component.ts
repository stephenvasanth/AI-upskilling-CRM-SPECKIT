import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { DashboardService, DashboardSummaryDto } from '../dashboard.service';
import { MetricCardComponent } from '../metric-card/metric-card.component';
import { PipelineSummaryComponent } from '../pipeline-summary/pipeline-summary.component';
import { MyTasksWidgetComponent } from '../my-tasks-widget/my-tasks-widget.component';
import { RecentActivityWidgetComponent } from '../recent-activity-widget/recent-activity-widget.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetricCardComponent, PipelineSummaryComponent, MyTasksWidgetComponent, RecentActivityWidgetComponent],
  template: `
    <div class="dashboard">
      <div class="dashboard__header">
        <h1 class="dashboard__title">Dashboard</h1>
      </div>

      @if (loading()) {
        <div class="dashboard__skeleton">
          <div class="skeleton-card" aria-busy="true"></div>
          <div class="skeleton-card" aria-busy="true"></div>
          <div class="skeleton-card" aria-busy="true"></div>
        </div>
        <div class="dashboard__grid">
          <div class="skeleton-block" aria-busy="true"></div>
          <div class="skeleton-block" aria-busy="true"></div>
        </div>
      } @else if (summary()) {
        <!-- Metric cards -->
        <div class="dashboard__metrics">
          <app-metric-card
            label="Open Deals"
            [value]="summary()!.metrics.openDealCount"
          />
          <app-metric-card
            label="Pipeline Value"
            [value]="summary()!.metrics.totalPipelineValue"
            prefix="£"
            format="currency"
          />
          <app-metric-card
            label="Tasks Due Today"
            [value]="summary()!.metrics.todayTaskCount"
          />
          <app-metric-card
            label="New Contacts (7d)"
            [value]="summary()!.metrics.newContactCount"
          />
        </div>

        <!-- Lower grid -->
        <div class="dashboard__grid">
          <div class="dashboard-widget">
            <h2 class="dashboard-widget__title">Pipeline by Stage</h2>
            <app-pipeline-summary [data]="summary()!.pipelineSummary" />
          </div>
          <div class="dashboard-widget">
            <h2 class="dashboard-widget__title">My Tasks</h2>
            <app-my-tasks-widget [tasks]="summary()!.myTasks" />
          </div>
          <div class="dashboard-widget dashboard-widget--full">
            <h2 class="dashboard-widget__title">Recent Activity</h2>
            <app-recent-activity-widget [activities]="summary()!.recentActivities" />
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { padding: var(--space-8); display: flex; flex-direction: column; gap: var(--space-6); }
    .dashboard__header { margin-bottom: var(--space-2); }
    .dashboard__title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .dashboard__metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
    }
    .dashboard__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }
    .dashboard-widget {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .dashboard-widget--full { grid-column: 1 / -1; }
    .dashboard-widget__title {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
    }
    .dashboard__skeleton {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-4);
    }
    .skeleton-card {
      height: 100px;
      background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-lg);
    }
    .skeleton-block {
      height: 200px;
      background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-lg);
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .skeleton-card, .skeleton-block { animation: none; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly loading = signal(true);
  readonly summary = signal<DashboardSummaryDto | null>(null);

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe({
      next: data => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
