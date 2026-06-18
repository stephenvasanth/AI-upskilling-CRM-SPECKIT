import { Routes } from '@angular/router';

export const contactsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./contacts-list/contacts-list.component').then(m => m.ContactsListComponent)
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./contact-form/contact-form.component').then(m => m.ContactFormComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./contact-detail/contact-detail.component').then(m => m.ContactDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./contact-form/contact-form.component').then(m => m.ContactFormComponent)
  }
];
