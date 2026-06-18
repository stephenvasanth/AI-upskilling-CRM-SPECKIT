import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent],
  template: `
    <div class="profile-page">
      <h1 class="profile-page__title">My Profile</h1>

      <div class="profile-card">
        <h2 class="profile-card__heading">Display Name</h2>
        <form [formGroup]="nameForm" (ngSubmit)="saveName()" class="profile-card__form">
          <app-input
            label="Display name"
            type="text"
            formControlName="displayName"
            [errorMessage]="nameError()"
          />
          <app-button type="submit" [loading]="savingName()">Save Name</app-button>
        </form>
      </div>

      <div class="profile-card">
        <h2 class="profile-card__heading">Change Password</h2>
        <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="profile-card__form">
          <app-input
            label="Current password"
            type="password"
            formControlName="currentPassword"
            [errorMessage]="currentPasswordError()"
          />
          <app-input
            label="New password"
            type="password"
            formControlName="newPassword"
            [errorMessage]="newPasswordError()"
          />
          <app-button type="submit" [loading]="savingPassword()">Change Password</app-button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { padding: var(--space-8); max-width: 600px; }
    .profile-page__title { font-size: var(--font-size-lg); margin-bottom: var(--space-6); }
    .profile-card {
      background: var(--color-surface); border-radius: var(--radius-md);
      border: 1px solid var(--color-border); padding: var(--space-6);
      margin-bottom: var(--space-4);
    }
    .profile-card__heading { font-size: var(--font-size-md); margin-bottom: var(--space-4); }
    .profile-card__form { display: flex; flex-direction: column; gap: var(--space-4); align-items: flex-start; }
  `]
})
export class ProfileComponent {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly savingName = signal(false);
  readonly savingPassword = signal(false);

  readonly nameForm = new FormGroup({
    displayName: new FormControl(
      this.authService.currentUser()?.displayName ?? '',
      { validators: [Validators.required, Validators.maxLength(100)], nonNullable: true }
    )
  });

  readonly passwordForm = new FormGroup({
    currentPassword: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    newPassword: new FormControl('', { validators: [Validators.required, Validators.minLength(8)], nonNullable: true })
  });

  nameError(): string {
    const ctrl = this.nameForm.controls.displayName;
    if (ctrl.touched && ctrl.errors?.['required']) return 'Display name is required';
    if (ctrl.touched && ctrl.errors?.['maxlength']) return 'Display name must be 100 characters or fewer';
    return '';
  }

  currentPasswordError(): string {
    const ctrl = this.passwordForm.controls.currentPassword;
    if (ctrl.touched && ctrl.errors?.['required']) return 'Current password is required';
    return '';
  }

  newPasswordError(): string {
    const ctrl = this.passwordForm.controls.newPassword;
    if (ctrl.touched && ctrl.errors?.['required']) return 'New password is required';
    if (ctrl.touched && ctrl.errors?.['minlength']) return 'Password must be at least 8 characters';
    return '';
  }

  saveName(): void {
    if (this.nameForm.invalid) { this.nameForm.markAllAsTouched(); return; }
    this.savingName.set(true);
    this.http.put<{ displayName: string }>('/api/auth/profile', this.nameForm.getRawValue()).subscribe({
      next: result => {
        this.authService.updateCurrentUser({ displayName: result.displayName });
        this.toast.success('Display name updated');
        this.savingName.set(false);
      },
      error: () => {
        this.toast.error('Failed to update display name');
        this.savingName.set(false);
      }
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.savingPassword.set(true);
    this.http.put('/api/auth/password', this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Password changed successfully');
        this.passwordForm.reset();
        this.savingPassword.set(false);
      },
      error: (err) => {
        const code = err.error?.error?.code;
        this.toast.error(code === 'INVALID_PASSWORD' ? 'Current password is incorrect' : 'Failed to change password');
        this.savingPassword.set(false);
      }
    });
  }
}
