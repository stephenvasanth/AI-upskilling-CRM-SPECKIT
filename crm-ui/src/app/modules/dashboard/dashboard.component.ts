import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div style="padding: 32px"><h1>Dashboard</h1><p>Coming soon — module 006.</p></div>`
})
export class DashboardComponent {}
