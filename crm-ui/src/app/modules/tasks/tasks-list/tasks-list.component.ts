import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TasksService, TaskDto, TaskFilter, TaskStatus, TASK_FILTER_LABELS } from '../tasks.service';
import { TaskDrawerComponent } from '../task-drawer/task-drawer.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TaskDrawerComponent, ButtonComponent],
  template: `
    <div class="tasks-page">
      <div class="tasks-page__header">
        <h1 class="tasks-page__title">Tasks</h1>
        <app-button (click)="openNewTask()">New Task</app-button>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs" role="tablist">
        @for (f of filterKeys; track f) {
          <button
            role="tab"
            class="filter-tab"
            [class.filter-tab--active]="activeFilter() === f"
            (click)="setFilter(f)"
          >{{ filterLabels[f] }}</button>
        }
      </div>

      @if (loading()) {
        <div class="tasks-page__state">Loading…</div>
      } @else if (tasks().length === 0) {
        <div class="tasks-page__state">No tasks found for this filter.</div>
      } @else {
        <div class="tasks-table-wrap">
          <table class="tasks-table">
            <thead>
              <tr>
                <th class="tasks-table__th tasks-table__th--check"></th>
                <th class="tasks-table__th">Title</th>
                <th class="tasks-table__th">Due</th>
                <th class="tasks-table__th">Assignee</th>
                <th class="tasks-table__th">Contact</th>
              </tr>
            </thead>
            <tbody>
              @for (task of tasks(); track task.id) {
                <tr class="tasks-table__row"
                    [class.tasks-table__row--completed]="task.status === 'COMPLETED'"
                    (click)="openEditTask(task)">
                  <td class="tasks-table__td tasks-table__td--check" (click)="$event.stopPropagation()">
                    <input
                      type="checkbox"
                      class="task-checkbox"
                      [checked]="task.status === 'COMPLETED'"
                      (change)="toggleTask(task)"
                      [attr.aria-label]="'Mark ' + task.title + ' as ' + (task.status === 'COMPLETED' ? 'pending' : 'complete')"
                    />
                  </td>
                  <td class="tasks-table__td">
                    <span [class.tasks-table__title--done]="task.status === 'COMPLETED'">{{ task.title }}</span>
                  </td>
                  <td class="tasks-table__td">
                    <span class="due-chip" [class]="dueDateClass(task)">{{ task.dueDate }}</span>
                  </td>
                  <td class="tasks-table__td">{{ task.assigneeName ?? '—' }}</td>
                  <td class="tasks-table__td">
                    @if (task.contactName) {
                      <span class="contact-chip">{{ task.contactName }}</span>
                    } @else { — }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (hasMore()) {
          <div class="tasks-page__load-more">
            <app-button variant="secondary" (click)="loadMore()">Load more</app-button>
          </div>
        }
      }
    </div>

    <app-task-drawer
      [open]="drawerOpen()"
      [editTask]="editingTask()"
      (close)="closeDrawer()"
      (saved)="reload()"
    />
  `,
  styles: [`
    .tasks-page { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .tasks-page__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-border); flex-shrink: 0; }
    .tasks-page__title { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0; }
    .tasks-page__state { padding: var(--space-8); text-align: center; color: var(--color-text-secondary); }
    .tasks-page__load-more { display: flex; justify-content: center; padding: var(--space-4); }
    .filter-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--color-border); padding: 0 var(--space-6); flex-shrink: 0; }
    .filter-tab { padding: var(--space-3) var(--space-4); background: none; border: none; border-bottom: 2px solid transparent; font-size: var(--font-size-sm); color: var(--color-text-secondary); cursor: pointer; white-space: nowrap; margin-bottom: -1px; transition: color var(--duration-fast); }
    .filter-tab:hover { color: var(--color-primary); }
    .filter-tab--active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: var(--font-weight-medium); }
    .tasks-table-wrap { flex: 1; overflow-y: auto; padding: var(--space-4) var(--space-6); }
    .tasks-table { width: 100%; border-collapse: collapse; }
    .tasks-table__th { text-align: left; padding: var(--space-2) var(--space-3); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--color-border); }
    .tasks-table__th--check { width: 40px; }
    .tasks-table__row { cursor: pointer; transition: background-color var(--duration-fast); }
    .tasks-table__row:hover { background: var(--color-background); }
    .tasks-table__row--completed { opacity: 0.6; }
    .tasks-table__td { padding: var(--space-3) var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-primary); border-bottom: 1px solid var(--color-border); }
    .tasks-table__td--check { width: 40px; }
    .tasks-table__title--done { text-decoration: line-through; color: var(--color-text-secondary); }
    .task-checkbox { width: 16px; height: 16px; cursor: pointer; accent-color: var(--color-primary); }
    .due-chip { padding: 2px var(--space-2); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); }
    .due-chip--overdue { background: #fee2e2; color: #b91c1c; }
    .due-chip--today { background: #fef3c7; color: #d97706; }
    .due-chip--normal { background: var(--color-background); color: var(--color-text-secondary); }
    .contact-chip { font-size: var(--font-size-xs); background: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--radius-full); padding: 1px var(--space-2); color: var(--color-text-secondary); }
  `]
})
export class TasksListComponent implements OnInit {
  private readonly tasksService = inject(TasksService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly filterKeys: TaskFilter[] = ['ALL', 'MY_TASKS', 'OVERDUE', 'TODAY', 'UPCOMING', 'COMPLETED'];
  readonly filterLabels = TASK_FILTER_LABELS;

  readonly tasks = signal<TaskDto[]>([]);
  readonly loading = signal(true);
  readonly hasMore = signal(false);
  readonly activeFilter = signal<TaskFilter>('ALL');
  readonly drawerOpen = signal(false);
  readonly editingTask = signal<TaskDto | null>(null);

  private currentPage = 0;

  ngOnInit(): void {
    const filter = (this.route.snapshot.queryParamMap.get('filter') ?? 'ALL').toUpperCase() as TaskFilter;
    this.activeFilter.set(filter);
    this.loadTasks();
  }

  setFilter(filter: TaskFilter): void {
    this.activeFilter.set(filter);
    this.router.navigate([], { queryParams: { filter: filter.toLowerCase() }, replaceUrl: true });
    this.currentPage = 0;
    this.tasks.set([]);
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.tasksService.getTasks(this.activeFilter(), this.currentPage).subscribe({
      next: res => {
        const existing = this.currentPage === 0 ? [] : this.tasks();
        this.tasks.set([...existing, ...res.content]);
        this.hasMore.set(this.currentPage + 1 < res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  reload(): void {
    this.currentPage = 0;
    this.tasks.set([]);
    this.loadTasks();
  }

  loadMore(): void {
    this.currentPage++;
    this.loadTasks();
  }

  openNewTask(): void {
    this.editingTask.set(null);
    this.drawerOpen.set(true);
  }

  openEditTask(task: TaskDto): void {
    this.editingTask.set(task);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingTask.set(null);
  }

  toggleTask(task: TaskDto): void {
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const snapshot = [...this.tasks()];

    this.tasks.update(list =>
      list.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
    );

    this.tasksService.toggleTask(task.id, newStatus).pipe(
      catchError(() => {
        this.tasks.set(snapshot);
        this.toast.error('Failed to update task status');
        return EMPTY;
      })
    ).subscribe();
  }

  dueDateClass(task: TaskDto): string {
    if (task.status === 'COMPLETED') return 'due-chip due-chip--normal';
    const today = new Date().toISOString().split('T')[0];
    if (task.dueDate < today) return 'due-chip due-chip--overdue';
    if (task.dueDate === today) return 'due-chip due-chip--today';
    return 'due-chip due-chip--normal';
  }
}
