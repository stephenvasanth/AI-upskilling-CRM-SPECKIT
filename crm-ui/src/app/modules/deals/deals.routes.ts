import { Routes } from '@angular/router';

export const dealsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./deal-board/deal-board.component').then(m => m.DealBoardComponent)
  }
];
