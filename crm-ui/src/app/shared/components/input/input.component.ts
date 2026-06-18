import { Component, ChangeDetectionStrategy, forwardRef, computed, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="field">
      @if (label()) {
        <label [for]="inputId()" class="field__label">{{ label() }}</label>
      }
      <div class="field__wrapper" [ngClass]="{ 'field__wrapper--error': !!errorMessage() }">
        <input
          [id]="inputId()"
          [type]="effectiveType()"
          [placeholder]="placeholder()"
          [disabled]="isDisabled()"
          [value]="value()"
          (input)="onInput($event)"
          (blur)="onTouched()"
          class="field__input"
        />
        @if (type() === 'password') {
          <button type="button" class="field__toggle" (click)="togglePassword()">
            {{ showPassword() ? 'Hide' : 'Show' }}
          </button>
        }
      </div>
      @if (errorMessage()) {
        <span class="field__error" role="alert">{{ errorMessage() }}</span>
      }
    </div>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); }
    .field__wrapper { position: relative; display: flex; }
    .field__input {
      width: 100%; height: 40px; padding: 0 var(--space-3);
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      font-size: var(--font-size-base); color: var(--color-text-primary);
      background: var(--color-surface); outline: none;
      transition: border-color var(--duration-fast);
    }
    .field__input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-light); }
    .field__input:disabled { background: var(--color-background); color: var(--color-text-disabled); }
    .field__wrapper--error .field__input { border-color: var(--color-danger); }
    .field__toggle { position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%); background: none; border: none; font-size: var(--font-size-sm); color: var(--color-text-secondary); cursor: pointer; }
    .field__error { font-size: var(--font-size-sm); color: var(--color-danger); }
  `]
})
export class InputComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly type = input<'text' | 'email' | 'password'>('text');
  readonly placeholder = input('');
  readonly inputId = input('input-' + Math.random().toString(36).slice(2));
  readonly errorMessage = input('');

  readonly value = signal('');
  readonly isDisabled = signal(false);
  readonly showPassword = signal(false);
  readonly effectiveType = computed(() =>
    this.type() === 'password' && this.showPassword() ? 'text' : this.type()
  );

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void { this.value.set(value ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}
