import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/auth/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/dashboard/dashboard.routes').then(m => m.dashboardRoutes)
  },
  {
    path: 'contacts',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/contacts/contacts.routes').then(m => m.contactsRoutes)
  },
  {
    path: 'deals',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/deals/deals.routes').then(m => m.dealsRoutes)
  },
  {
    path: 'activities',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/activities/activities.routes').then(m => m.activitiesRoutes)
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/tasks/tasks.routes').then(m => m.tasksRoutes)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () =>
      import('./modules/admin/admin.routes').then(m => m.adminRoutes)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
