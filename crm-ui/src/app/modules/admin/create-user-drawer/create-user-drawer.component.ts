import { Component, ChangeDetectionStrategy, inject, signal, input, output, OnChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUsersService, CreateUserRequest, UserAdminDto, UserRole } from '../admin-users.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

@Component({
  selector: 'app-create-user-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent],
  template: `
    @if (open()) {
      <div class="drawer-overlay" (click)="onClose()"></div>
      <aside class="drawer" role="dialog" aria-label="Invite team member">
        <div class="drawer__header">
          <h2 class="drawer__title">Invite Team Member</h2>
          <button class="drawer__close" (click)="onClose()" aria-label="Close">✕</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="drawer__body">
          <app-input
            label="Full name"
            formControlName="displayName"
            [errorMessage]="fieldError('displayName')"
            inputId="user-name"
          />
          <app-input
            label="Email address"
            type="email"
            formControlName="email"
            [errorMessage]="fieldError('email')"
            inputId="user-email"
          />
          <app-input
            label="Initial password"
            type="password"
            formControlName="initialPassword"
            [errorMessage]="fieldError('initialPassword')"
            inputId="user-password"
          />

          <div class="form-field">
            <label class="form-field__label" for="user-role">Role</label>
            <select id="user-role" formControlName="role" class="form-field__select">
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          @if (serverError()) {
            <div class="drawer__error" role="alert">{{ serverError() }}</div>
          }

          <div class="drawer__footer">
            <app-button type="button" variant="secondary" (click)="onClose()">Cancel</app-button>
            <app-button type="submit" [loading]="saving()" [disabled]="form.invalid">Invite</app-button>
          </div>
        </form>
      </aside>
    }
  `,
  styles: [`
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0; width: 400px;
      background: var(--color-surface); box-shadow: var(--shadow-lg);
      z-index: 101; display: flex; flex-direction: column;
      animation: slideIn var(--duration-normal) ease;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @media (prefers-reduced-motion: reduce) { .drawer { animation: none; } }
    .drawer__header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-6); border-bottom: 1px solid var(--color-border);
    }
    .drawer__title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }
    .drawer__close { background: none; border: none; cursor: pointer; font-size: var(--font-size-md); color: var(--color-text-secondary); padding: var(--space-1); }
    .drawer__body { flex: 1; overflow-y: auto; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
    .form-field { display: flex; flex-direction: column; gap: var(--space-1); }
    .form-field__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
    .form-field__select {
      height: 40px; padding: 0 var(--space-3); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); font-size: var(--font-size-sm);
      background: var(--color-surface); color: var(--color-text-primary);
    }
    .drawer__error { background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: var(--space-3); color: var(--color-danger); font-size: var(--font-size-sm); }
    .drawer__footer { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: auto; padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
  `]
})
export class CreateUserDrawerComponent implements OnChanges {
  readonly open = input(false);
  readonly close = output<void>();
  readonly saved = output<UserAdminDto>();

  private readonly usersService = inject(AdminUsersService);
  private readonly toast = inject(ToastService);

  readonly saving = signal(false);
  readonly serverError = signal('');

  readonly form = new FormGroup({
    displayName: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    initialPassword: new FormControl('', { validators: [Validators.required, Validators.minLength(8)], nonNullable: true }),
    role: new FormControl<UserRole>('USER', { validators: [Validators.required], nonNullable: true })
  });

  ngOnChanges(): void {
    if (!this.open()) {
      this.form.reset({ displayName: '', email: '', initialPassword: '', role: 'USER' });
      this.serverError.set('');
    }
  }

  fieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'This field is required';
    if (ctrl.errors['email']) return 'Must be a valid email address';
    if (ctrl.errors['minlength']) return 'Password must be at least 8 characters';
    return '';
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.serverError.set('');
    const { displayName, email, initialPassword, role } = this.form.getRawValue();
    const body: CreateUserRequest = { displayName, email, initialPassword, role };
    this.usersService.createUser(body).subscribe({
      next: user => {
        this.saving.set(false);
        this.toast.success(`${user.displayName} invited successfully`);
        this.saved.emit(user);
      },
      error: (err) => {
        this.saving.set(false);
        const code = err?.error?.error?.code;
        this.serverError.set(code === 'CONFLICT' ? 'Email already in use' : 'Failed to invite user');
      }
    });
  }
}
