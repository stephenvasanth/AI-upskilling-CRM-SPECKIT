import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { AdminUsersService, UserAdminDto, UserRole, UserStatus } from '../admin-users.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { CreateUserDrawerComponent } from '../create-user-drawer/create-user-drawer.component';

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, BadgeComponent, CreateUserDrawerComponent],
  template: `
    <div class="admin-page">
      <div class="admin-page__header">
        <h1 class="admin-page__title">Team Members</h1>
        <app-button (click)="inviteOpen.set(true)">+ Invite User</app-button>
      </div>

      @if (loading()) {
        <p class="admin-page__loading">Loading…</p>
      } @else if (users().length === 0) {
        <p class="admin-page__empty">No users found.</p>
      } @else {
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr [class.data-table__row--inactive]="user.status === 'INACTIVE'">
                  <td class="data-table__name">{{ user.displayName }}</td>
                  <td class="data-table__email">{{ user.email }}</td>
                  <td>
                    <app-badge [color]="user.role === 'ADMIN' ? '#4f46e522' : '#94a3b822'" [textColor]="user.role === 'ADMIN' ? '#4f46e5' : '#64748b'">
                      {{ user.role }}
                    </app-badge>
                  </td>
                  <td>
                    <app-badge [color]="user.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2'" [textColor]="user.status === 'ACTIVE' ? '#166534' : '#991b1b'">
                      {{ user.status }}
                    </app-badge>
                  </td>
                  <td class="data-table__date">{{ formatDate(user.createdAt) }}</td>
                  <td class="data-table__actions">
                    @if (!isSelf(user.id)) {
                      <select
                        class="inline-select"
                        [value]="user.role"
                        (change)="onRoleChange(user, $event)"
                        [disabled]="updatingId() === user.id"
                        aria-label="Change role"
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        class="status-btn"
                        [class.status-btn--deactivate]="user.status === 'ACTIVE'"
                        [class.status-btn--activate]="user.status === 'INACTIVE'"
                        (click)="toggleStatus(user)"
                        [disabled]="updatingId() === user.id"
                      >
                        {{ user.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
                      </button>
                    } @else {
                      <span class="data-table__self-label">You</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <app-create-user-drawer
      [open]="inviteOpen()"
      (close)="inviteOpen.set(false)"
      (saved)="onUserCreated($event)"
    />
  `,
  styles: [`
    .admin-page { padding: var(--space-8); }
    .admin-page__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); }
    .admin-page__title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .admin-page__loading, .admin-page__empty { color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
    .data-table th { text-align: left; padding: var(--space-3) var(--space-4); background: var(--color-surface); border-bottom: 2px solid var(--color-border); font-weight: var(--font-weight-semibold); color: var(--color-text-secondary); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.05em; }
    .data-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
    .data-table__row--inactive td { opacity: 0.6; }
    .data-table__name { font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
    .data-table__email { color: var(--color-text-secondary); }
    .data-table__date { color: var(--color-text-secondary); white-space: nowrap; }
    .data-table__actions { display: flex; align-items: center; gap: var(--space-2); }
    .data-table__self-label { font-size: var(--font-size-xs); color: var(--color-text-disabled); font-style: italic; }
    .inline-select {
      height: 32px; padding: 0 var(--space-2); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); font-size: var(--font-size-xs);
      background: var(--color-surface); color: var(--color-text-primary); cursor: pointer;
    }
    .status-btn {
      font-size: var(--font-size-xs); padding: 4px var(--space-3);
      border-radius: var(--radius-sm); border: 1px solid;
      cursor: pointer; font-weight: var(--font-weight-medium);
      background: none;
    }
    .status-btn--deactivate { border-color: #fecaca; color: #b91c1c; }
    .status-btn--deactivate:hover { background: #fef2f2; }
    .status-btn--activate { border-color: #bbf7d0; color: #166534; }
    .status-btn--activate:hover { background: #dcfce7; }
    .status-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(AdminUsersService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly users = signal<UserAdminDto[]>([]);
  readonly loading = signal(true);
  readonly inviteOpen = signal(false);
  readonly updatingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.usersService.listUsers().subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isSelf(userId: string): boolean {
    return this.auth.currentUser()?.id === userId;
  }

  onUserCreated(user: UserAdminDto): void {
    this.users.update(list => [...list, user]);
    this.inviteOpen.set(false);
  }

  onRoleChange(user: UserAdminDto, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as UserRole;
    if (role === user.role) return;
    this.updatingId.set(user.id);
    this.usersService.updateRole(user.id, role).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.updatingId.set(null);
        this.toast.success('Role updated');
      },
      error: (err) => {
        this.updatingId.set(null);
        const code = err?.error?.error?.code;
        this.toast.error(code === 'LAST_ADMIN' ? 'Cannot demote the last admin' : 'Failed to update role');
        // Revert select to original value by re-setting users
        this.users.update(list => [...list]);
      }
    });
  }

  toggleStatus(user: UserAdminDto): void {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.updatingId.set(user.id);
    this.usersService.updateStatus(user.id, newStatus).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.updatingId.set(null);
        this.toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      },
      error: (err) => {
        this.updatingId.set(null);
        const code = err?.error?.error?.code;
        if (code === 'LAST_ADMIN') this.toast.error('Cannot deactivate the last admin');
        else if (code === 'SELF_DEACTIVATION') this.toast.error('Cannot deactivate your own account');
        else this.toast.error('Failed to update status');
      }
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
