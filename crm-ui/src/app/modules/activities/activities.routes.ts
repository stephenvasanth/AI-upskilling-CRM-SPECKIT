import { Routes } from '@angular/router';

export const activitiesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./activities-global/activities-global.component').then(m => m.ActivitiesGlobalComponent)
  }
];
