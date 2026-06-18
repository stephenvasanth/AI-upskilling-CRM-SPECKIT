import { Component, ChangeDetectionStrategy, OnInit, inject, signal, viewChild, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { ActivityFeedComponent } from '../../../shared/components/activity-feed/activity-feed.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ActivityFilterParams, ActivityType } from '../activities.service';
import { LogActivityDrawerComponent } from '../log-activity-drawer/log-activity-drawer.component';

@Component({
  selector: 'app-activities-global',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ActivityFeedComponent, ButtonComponent, LogActivityDrawerComponent],
  template: `
    <div class="global-page">
      <div class="global-page__header">
        <h1 class="global-page__title">Activities</h1>
        <app-button (click)="logOpen.set(true)">Log Activity</app-button>
      </div>

      <div class="filter-bar">
        <form [formGroup]="filters" class="filter-bar__form">
          <div class="filter-bar__field">
            <label for="filter-type" class="filter-bar__label">Type</label>
            <select id="filter-type" formControlName="type" class="filter-bar__select">
              <option value="">All types</option>
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">Meeting</option>
              <option value="NOTE">Note</option>
            </select>
          </div>
          <div class="filter-bar__field">
            <label for="filter-date-from" class="filter-bar__label">From</label>
            <input id="filter-date-from" type="date" formControlName="dateFrom" class="filter-bar__input" />
          </div>
          <div class="filter-bar__field">
            <label for="filter-date-to" class="filter-bar__label">To</label>
            <input id="filter-date-to" type="date" formControlName="dateTo" class="filter-bar__input" />
          </div>
          <app-button variant="ghost" type="button" (click)="clearFilters()">Clear</app-button>
        </form>
      </div>

      <div class="global-page__feed">
        <app-activity-feed
          [contactId]="null"
          [dealId]="null"
          [extraFilters]="activeFilters()"
          [showLogCta]="true"
          #feedRef
        />
      </div>
    </div>

    <app-log-activity-drawer
      [open]="logOpen()"
      (close)="logOpen.set(false)"
      (saved)="feedRef.refresh()"
    />
  `,
  styles: [`
    .global-page { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .global-page__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-border); flex-shrink: 0; }
    .global-page__title { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0; }
    .filter-bar { padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--color-border); background: var(--color-surface); flex-shrink: 0; }
    .filter-bar__form { display: flex; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
    .filter-bar__field { display: flex; flex-direction: column; gap: 4px; }
    .filter-bar__label { font-size: var(--font-size-xs); color: var(--color-text-secondary); font-weight: var(--font-weight-medium); }
    .filter-bar__select, .filter-bar__input { height: 36px; padding: 0 var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); color: var(--color-text-primary); background: var(--color-surface); outline: none; }
    .filter-bar__select:focus, .filter-bar__input:focus { border-color: var(--color-primary); }
    .global-page__feed { flex: 1; overflow-y: auto; padding: var(--space-5) var(--space-6); max-width: 800px; }
  `]
})
export class ActivitiesGlobalComponent implements OnInit {
  readonly logOpen = signal(false);
  readonly activeFilters = signal<Partial<ActivityFilterParams>>({});

  readonly filters = new FormGroup({
    type:     new FormControl<ActivityType | ''>('', { nonNullable: true }),
    dateFrom: new FormControl('', { nonNullable: true }),
    dateTo:   new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.filters.valueChanges.pipe(debounceTime(400)).subscribe(v => {
      const params: Partial<ActivityFilterParams> = {};
      if (v.type)     params.type = v.type as ActivityType;
      if (v.dateFrom) params.dateFrom = new Date(v.dateFrom).toISOString();
      if (v.dateTo)   params.dateTo   = new Date(v.dateTo + 'T23:59:59').toISOString();
      this.activeFilters.set(params);
    });
  }

  clearFilters(): void {
    this.filters.reset({ type: '', dateFrom: '', dateTo: '' });
    this.activeFilters.set({});
  }
}
