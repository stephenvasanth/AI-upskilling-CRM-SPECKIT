import { Component, ChangeDetectionStrategy, OnChanges, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivitiesService, ActivityDto, ActivityFilterParams, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS } from '../../../modules/activities/activities.service';
import { ModalComponent } from '../modal/modal.component';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ModalComponent],
  template: `
    <div class="activity-feed">
      @if (loading()) {
        <div class="activity-feed__state">Loading…</div>
      } @else if (activities().length === 0) {
        <div class="activity-feed__empty">
          <p>No activities yet.</p>
          @if (showLogCta()) {
            <p class="activity-feed__cta">Click "Log Activity" to record the first interaction.</p>
          }
        </div>
      } @else {
        <ul class="activity-feed__list">
          @for (item of activities(); track item.id) {
            <li class="activity-entry" (mouseenter)="hoveredId.set(item.id)" (mouseleave)="hoveredId.set(null)">
              <div class="activity-entry__type-badge"
                   [style.background]="typeColor(item.type) + '22'"
                   [style.color]="typeColor(item.type)">
                {{ typeLabel(item.type) }}
              </div>
              <div class="activity-entry__body">
                <p class="activity-entry__subject">{{ item.subject }}</p>
                @if (item.notes) {
                  <p class="activity-entry__notes">{{ item.notes }}</p>
                }
                <div class="activity-entry__meta">
                  @if (item.authorName) { <span>{{ item.authorName }}</span> }
                  <span>{{ item.activityDate | date:'d MMM y, h:mm a' }}</span>
                  @if (item.contactName && !contactId()) {
                    <span class="activity-entry__chip">{{ item.contactName }}</span>
                  }
                  @if (item.dealTitle && !dealId()) {
                    <span class="activity-entry__chip">{{ item.dealTitle }}</span>
                  }
                </div>
              </div>
              @if (hoveredId() === item.id) {
                <button
                  class="activity-entry__delete"
                  (click)="pendingDeleteId.set(item.id)"
                  aria-label="Delete activity"
                >✕</button>
              }
            </li>
          }
        </ul>

        @if (hasMore()) {
          <button class="activity-feed__load-more" (click)="loadMore()">Load more</button>
        }
      }
    </div>

    <app-modal
      [open]="pendingDeleteId() !== null"
      title="Delete Activity"
      message="Delete this activity? This cannot be undone."
      confirmLabel="Delete"
      confirmVariant="danger"
      (confirm)="confirmDelete()"
      (cancel)="pendingDeleteId.set(null)"
    />
  `,
  styles: [`
    .activity-feed { display: flex; flex-direction: column; }
    .activity-feed__state { padding: var(--space-4); text-align: center; color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .activity-feed__empty { padding: var(--space-4); color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .activity-feed__cta { font-size: var(--font-size-xs); color: var(--color-text-disabled); margin-top: var(--space-1); }
    .activity-feed__list { list-style: none; display: flex; flex-direction: column; gap: 0; }
    .activity-feed__load-more { margin-top: var(--space-3); width: 100%; padding: var(--space-2); background: none; border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text-secondary); font-size: var(--font-size-sm); cursor: pointer; }
    .activity-feed__load-more:hover { background: var(--color-background); }
    .activity-entry { display: flex; gap: var(--space-3); align-items: flex-start; padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); position: relative; }
    .activity-entry:last-child { border-bottom: none; }
    .activity-entry__type-badge { padding: 2px var(--space-2); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
    .activity-entry__body { flex: 1; min-width: 0; }
    .activity-entry__subject { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); margin-bottom: 2px; }
    .activity-entry__notes { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .activity-entry__meta { display: flex; gap: var(--space-2); font-size: var(--font-size-xs); color: var(--color-text-disabled); margin-top: var(--space-1); flex-wrap: wrap; align-items: center; }
    .activity-entry__chip { background: var(--color-background); border-radius: var(--radius-full); padding: 1px var(--space-2); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
    .activity-entry__delete { position: absolute; right: 0; top: var(--space-3); background: none; border: none; color: var(--color-text-disabled); cursor: pointer; padding: 2px var(--space-1); font-size: var(--font-size-sm); border-radius: var(--radius-sm); }
    .activity-entry__delete:hover { color: var(--color-danger); background: #fee2e2; }
  `]
})
export class ActivityFeedComponent implements OnChanges {
  private readonly activitiesService = inject(ActivitiesService);
  private readonly toast = inject(ToastService);

  readonly contactId = input<string | null>(null);
  readonly dealId = input<string | null>(null);
  readonly extraFilters = input<Partial<ActivityFilterParams>>({});
  readonly showLogCta = input(false);

  readonly activities = signal<ActivityDto[]>([]);
  readonly loading = signal(true);
  readonly hasMore = signal(false);
  readonly hoveredId = signal<string | null>(null);
  readonly pendingDeleteId = signal<string | null>(null);

  private currentPage = 0;

  ngOnChanges(): void {
    this.currentPage = 0;
    this.activities.set([]);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const params: ActivityFilterParams = {
      contactId: this.contactId() ?? undefined,
      dealId: this.dealId() ?? undefined,
      page: this.currentPage,
      ...this.extraFilters(),
    };
    this.activitiesService.getActivities(params).subscribe({
      next: res => {
        const existing = this.currentPage === 0 ? [] : this.activities();
        this.activities.set([...existing, ...res.content]);
        this.hasMore.set(this.currentPage + 1 < res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.ngOnChanges();
  }

  loadMore(): void {
    this.currentPage++;
    this.load();
  }

  typeLabel(type: string): string {
    return ACTIVITY_TYPE_LABELS[type as keyof typeof ACTIVITY_TYPE_LABELS] ?? type;
  }

  typeColor(type: string): string {
    return ACTIVITY_TYPE_COLORS[type as keyof typeof ACTIVITY_TYPE_COLORS] ?? '#6b7280';
  }

  confirmDelete(): void {
    const id = this.pendingDeleteId();
    if (!id) return;
    this.activitiesService.deleteActivity(id).subscribe({
      next: () => {
        this.toast.success('Activity deleted');
        this.activities.update(list => list.filter(a => a.id !== id));
        this.pendingDeleteId.set(null);
      },
      error: () => {
        this.pendingDeleteId.set(null);
        this.toast.error('Failed to delete activity');
      }
    });
  }
}
