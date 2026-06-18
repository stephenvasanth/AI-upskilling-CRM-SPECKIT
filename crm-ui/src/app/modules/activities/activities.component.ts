import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-activities',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div style="padding: 32px"><h1>Activities</h1><p>Coming soon — module 004.</p></div>`
})
export class ActivitiesComponent {}
