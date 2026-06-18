import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ActivityDto, ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS } from '../../activities/activities.service';

@Component({
  selector: 'app-recent-activity-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="recent-activity">
      @if (activities().length === 0) {
        <p class="recent-activity__empty">No activities logged yet.</p>
      } @else {
        <ul class="recent-activity__list">
          @for (activity of activities(); track activity.id) {
            <li class="recent-activity__item">
              <span class="recent-activity__icon" [title]="typeLabel(activity.type)">{{ typeIcon(activity.type) }}</span>
              <div class="recent-activity__body">
                <span class="recent-activity__subject">{{ activity.subject }}</span>
                <div class="recent-activity__meta">
                  @if (activity.contactId) {
                    <a [routerLink]="['/contacts', activity.contactId]" class="recent-activity__contact">{{ activity.contactName }}</a>
                  }
                  @if (activity.authorName) {
                    <span class="recent-activity__author">by {{ activity.authorName }}</span>
                  }
                  <span class="recent-activity__time">{{ activity.createdAt | date:'d MMM, HH:mm' }}</span>
                </div>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .recent-activity__empty { font-size: var(--font-size-sm); color: var(--color-text-disabled); }
    .recent-activity__list { list-style: none; display: flex; flex-direction: column; }
    .recent-activity__item {
      display: flex;
      gap: var(--space-3);
      align-items: flex-start;
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border);
    }
    .recent-activity__item:last-child { border-bottom: none; }
    .recent-activity__icon { font-size: var(--font-size-md); flex-shrink: 0; margin-top: 2px; }
    .recent-activity__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .recent-activity__subject { font-size: var(--font-size-sm); color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .recent-activity__meta { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .recent-activity__contact {
      font-size: var(--font-size-xs); color: var(--color-primary);
      text-decoration: none; font-weight: var(--font-weight-medium);
    }
    .recent-activity__contact:hover { text-decoration: underline; }
    .recent-activity__author { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .recent-activity__time { font-size: var(--font-size-xs); color: var(--color-text-disabled); margin-left: auto; white-space: nowrap; }
  `]
})
export class RecentActivityWidgetComponent {
  readonly activities = input<ActivityDto[]>([]);

  typeIcon(type: string): string {
    return ACTIVITY_TYPE_ICONS[type as keyof typeof ACTIVITY_TYPE_ICONS] ?? '●';
  }

  typeLabel(type: string): string {
    return ACTIVITY_TYPE_LABELS[type as keyof typeof ACTIVITY_TYPE_LABELS] ?? type;
  }
}
