import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-card__header">
          <h1 class="login-card__title">AI CRM</h1>
          <p class="login-card__subtitle">Sign in to your account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-card__form">
          <app-input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            formControlName="email"
            [errorMessage]="emailError()"
            inputId="login-email"
          />
          <app-input
            label="Password"
            type="password"
            placeholder="Your password"
            formControlName="password"
            [errorMessage]="passwordError()"
            inputId="login-password"
          />

          @if (serverError()) {
            <div class="login-card__error" role="alert">
              {{ serverError() }}
            </div>
          }

          <app-button
            type="submit"
            [loading]="loading()"
            [disabled]="form.invalid"
            style="width: 100%"
          >
            Sign In
          </app-button>
        </form>

        <p class="login-card__footer">
          <a href="#" class="login-card__forgot">Forgot password?</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface) 100%);
      padding: var(--space-6);
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: var(--space-8);
    }
    .login-card__header { text-align: center; margin-bottom: var(--space-8); }
    .login-card__title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-primary); }
    .login-card__subtitle { margin-top: var(--space-1); color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .login-card__form { display: flex; flex-direction: column; gap: var(--space-4); }
    .login-card__error {
      background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md);
      padding: var(--space-3); color: var(--color-danger); font-size: var(--font-size-sm);
    }
    .login-card__footer { text-align: center; margin-top: var(--space-4); }
    .login-card__forgot { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly serverError = signal('');

  readonly form = new FormGroup({
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    password: new FormControl('', { validators: [Validators.required], nonNullable: true })
  });

  emailError(): string {
    const ctrl = this.form.controls.email;
    if (ctrl.touched && ctrl.errors?.['required']) return 'Email is required';
    if (ctrl.touched && ctrl.errors?.['email']) return 'Must be a valid email address';
    return '';
  }

  passwordError(): string {
    const ctrl = this.form.controls.password;
    if (ctrl.touched && ctrl.errors?.['required']) return 'Password is required';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.serverError.set('');

    const { email, password } = this.form.getRawValue();
    this.authService.login(email, password).subscribe({
      error: () => {
        this.loading.set(false);
        this.serverError.set('Invalid email or password');
      }
    });
  }
}
