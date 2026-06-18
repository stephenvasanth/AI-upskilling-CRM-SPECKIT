import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: 'users',
    loadComponent: () =>
      import('./users/users.component').then(m => m.UsersComponent)
  },
  {
    path: 'tags',
    loadComponent: () =>
      import('./tags/tags.component').then(m => m.TagsComponent)
  }
];
