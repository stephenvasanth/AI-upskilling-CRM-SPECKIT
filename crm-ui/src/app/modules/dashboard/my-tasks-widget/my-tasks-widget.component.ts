import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskDto } from '../../tasks/tasks.service';

@Component({
  selector: 'app-my-tasks-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="my-tasks">
      @if (tasks().length === 0) {
        <p class="my-tasks__empty">You have no pending tasks. <a routerLink="/tasks" class="my-tasks__link">View all tasks</a></p>
      } @else {
        <ul class="my-tasks__list">
          @for (task of tasks(); track task.id) {
            <li class="my-tasks__item" routerLink="/tasks">
              <span class="my-tasks__title">{{ task.title }}</span>
              @if (task.dueDate) {
                <span class="my-tasks__due" [class]="dueDateClass(task.dueDate)">{{ task.dueDate }}</span>
              }
            </li>
          }
        </ul>
        <a routerLink="/tasks" class="my-tasks__view-all">View all tasks →</a>
      }
    </div>
  `,
  styles: [`
    .my-tasks__empty { font-size: var(--font-size-sm); color: var(--color-text-disabled); }
    .my-tasks__link { color: var(--color-primary); text-decoration: none; }
    .my-tasks__link:hover { text-decoration: underline; }
    .my-tasks__list { list-style: none; display: flex; flex-direction: column; }
    .my-tasks__item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
      text-decoration: none;
    }
    .my-tasks__item:last-child { border-bottom: none; }
    .my-tasks__item:hover { background: var(--color-surface-hover, rgba(0,0,0,0.02)); margin: 0 calc(-1 * var(--space-2)); padding-left: var(--space-2); padding-right: var(--space-2); }
    .my-tasks__title { font-size: var(--font-size-sm); color: var(--color-text-primary); }
    .my-tasks__due { font-size: var(--font-size-xs); padding: 2px 6px; border-radius: var(--radius-sm); }
    .my-tasks__due--overdue { background: #fee2e2; color: #b91c1c; }
    .my-tasks__due--today { background: #fef3c7; color: #92400e; }
    .my-tasks__due--normal { background: var(--color-border); color: var(--color-text-secondary); }
    .my-tasks__view-all {
      display: block; margin-top: var(--space-3);
      font-size: var(--font-size-sm); color: var(--color-primary);
      text-decoration: none; text-align: right;
    }
    .my-tasks__view-all:hover { text-decoration: underline; }
  `]
})
export class MyTasksWidgetComponent {
  readonly tasks = input<TaskDto[]>([]);

  dueDateClass(dueDate: string): string {
    const today = new Date().toISOString().split('T')[0];
    if (dueDate < today) return 'my-tasks__due my-tasks__due--overdue';
    if (dueDate === today) return 'my-tasks__due my-tasks__due--today';
    return 'my-tasks__due my-tasks__due--normal';
  }
}
