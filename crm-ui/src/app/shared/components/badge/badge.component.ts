import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [style.background]="color()" [style.color]="textColor()">
      <ng-content />
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex; align-items: center;
      padding: 2px var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      white-space: nowrap;
    }
  `]
})
export class BadgeComponent {
  readonly color = input('#E2E8F0');
  readonly textColor = input('#1E293B');
}
