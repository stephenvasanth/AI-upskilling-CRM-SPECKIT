import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-tasks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div style="padding: 32px"><h1>Tasks</h1><p>Coming soon — module 005.</p></div>`
})
export class TasksComponent {}
