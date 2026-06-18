import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

const AVATAR_COLOURS = [
  '#4F46E5', '#0891B2', '#059669', '#D97706',
  '#DC2626', '#7C3AED', '#DB2777', '#2563EB',
  '#16A34A', '#EA580C'
];

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="avatar"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.background]="colour()"
      [style.font-size.px]="size() * 0.36"
      [attr.aria-label]="name()"
    >
      {{ initials() }}
    </div>
  `,
  styles: [`
    .avatar {
      border-radius: var(--radius-full);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: var(--font-weight-semibold);
      flex-shrink: 0; user-select: none;
    }
  `]
})
export class AvatarComponent {
  readonly name = input('');
  readonly size = input(32);

  readonly initials = computed(() => {
    return (this.name() || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });

  readonly colour = computed(() => {
    const code = [...(this.name() || '')].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return AVATAR_COLOURS[code % AVATAR_COLOURS.length];
  });
}
