import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar" aria-label="Main navigation">
      <div class="sidebar__brand">
        <span class="sidebar__logo">AI CRM</span>
      </div>

      <ul class="sidebar__nav">
        <li>
          <a routerLink="/dashboard" routerLinkActive="sidebar__link--active" class="sidebar__link">
            <span class="sidebar__link-icon" aria-hidden="true">◈</span>
            Dashboard
          </a>
        </li>
        <li>
          <a routerLink="/contacts" routerLinkActive="sidebar__link--active" class="sidebar__link">
            <span class="sidebar__link-icon" aria-hidden="true">◎</span>
            Contacts
          </a>
        </li>
        <li>
          <a routerLink="/deals" routerLinkActive="sidebar__link--active" class="sidebar__link">
            <span class="sidebar__link-icon" aria-hidden="true">◇</span>
            Deals
          </a>
        </li>
        <li>
          <a routerLink="/activities" routerLinkActive="sidebar__link--active" class="sidebar__link">
            <span class="sidebar__link-icon" aria-hidden="true">◉</span>
            Activities
          </a>
        </li>
        <li>
          <a routerLink="/tasks" routerLinkActive="sidebar__link--active" class="sidebar__link">
            <span class="sidebar__link-icon" aria-hidden="true">◻</span>
            Tasks
          </a>
        </li>
      </ul>

      @if (auth.isAdmin()) {
        <div class="sidebar__section-label">Admin</div>
        <ul class="sidebar__nav">
          <li>
            <a routerLink="/admin/users" routerLinkActive="sidebar__link--active" class="sidebar__link">
              <span class="sidebar__link-icon" aria-hidden="true">◑</span>
              Users
            </a>
          </li>
          <li>
            <a routerLink="/admin/tags" routerLinkActive="sidebar__link--active" class="sidebar__link">
              <span class="sidebar__link-icon" aria-hidden="true">◐</span>
              Tags
            </a>
          </li>
        </ul>
      }

      <div class="sidebar__footer">
        <a routerLink="/profile" class="sidebar__user">
          <div class="sidebar__avatar" aria-hidden="true">
            {{ initials() }}
          </div>
          <div class="sidebar__user-info">
            <span class="sidebar__user-name">{{ auth.currentUser()?.displayName }}</span>
            <span class="sidebar__user-role">{{ auth.currentUser()?.role }}</span>
          </div>
        </a>
        <button class="sidebar__logout" (click)="auth.logout()" aria-label="Sign out">
          ↪
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      min-width: var(--sidebar-width);
      background: var(--color-sidebar-bg);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow-y: auto;
    }
    .sidebar__brand {
      padding: var(--space-6) var(--space-4);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .sidebar__logo {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      color: #fff;
      letter-spacing: 0.05em;
    }
    .sidebar__nav {
      list-style: none;
      padding: var(--space-2) 0;
    }
    .sidebar__section-label {
      padding: var(--space-4) var(--space-4) var(--space-1);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: rgba(199,210,254,0.5);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .sidebar__link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-4);
      color: var(--color-sidebar-text);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      border-radius: 0;
      transition: background-color var(--duration-fast);
      text-decoration: none;
    }
    .sidebar__link:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .sidebar__link--active { background: rgba(79,70,229,0.3); color: #fff; }
    .sidebar__link-icon { font-size: var(--font-size-md); opacity: 0.7; }
    .sidebar__footer {
      margin-top: auto;
      padding: var(--space-4);
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .sidebar__user {
      display: flex; align-items: center; gap: var(--space-2);
      flex: 1; text-decoration: none; min-width: 0;
    }
    .sidebar__avatar {
      width: 32px; height: 32px; border-radius: var(--radius-full);
      background: var(--color-primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold);
      flex-shrink: 0;
    }
    .sidebar__user-info { display: flex; flex-direction: column; min-width: 0; }
    .sidebar__user-name {
      font-size: var(--font-size-sm); color: #fff;
      font-weight: var(--font-weight-medium);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .sidebar__user-role { font-size: var(--font-size-xs); color: var(--color-sidebar-text); }
    .sidebar__logout {
      background: none; border: none; color: var(--color-sidebar-text);
      cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm);
      font-size: var(--font-size-md); flex-shrink: 0;
    }
    .sidebar__logout:hover { color: #fff; background: rgba(255,255,255,0.1); }
  `]
})
export class SidebarComponent {
  readonly auth = inject(AuthService);

  initials(): string {
    const name = this.auth.currentUser()?.displayName ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
