import { Routes } from '@angular/router';

export const tasksRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tasks-list/tasks-list.component').then(m => m.TasksListComponent)
  }
];
