import { Component, ChangeDetectionStrategy, inject, signal, input, output, OnChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminTagsService, CreateTagRequest, TagAdminDto } from '../admin-tags.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

const PRESET_COLOURS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#6366f1', '#64748b', '#84cc16', '#06b6d4',
];

@Component({
  selector: 'app-create-tag-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent],
  template: `
    @if (open()) {
      <div class="drawer-overlay" (click)="onClose()"></div>
      <aside class="drawer" role="dialog" aria-label="Create tag">
        <div class="drawer__header">
          <h2 class="drawer__title">Create Tag</h2>
          <button class="drawer__close" (click)="onClose()" aria-label="Close">✕</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="drawer__body">
          <app-input
            label="Tag name"
            formControlName="name"
            [errorMessage]="nameError()"
            inputId="tag-name"
          />

          <div class="form-field">
            <label class="form-field__label">Colour</label>
            <div class="colour-palette">
              @for (colour of presets; track colour) {
                <button
                  type="button"
                  class="colour-swatch"
                  [style.background]="colour"
                  [class.colour-swatch--selected]="form.controls.colour.value === colour"
                  (click)="form.controls.colour.setValue(colour)"
                  [attr.aria-label]="colour"
                ></button>
              }
            </div>
            <input type="color" formControlName="colour" class="colour-custom" title="Custom colour" />
          </div>

          @if (serverError()) {
            <div class="drawer__error" role="alert">{{ serverError() }}</div>
          }

          <div class="drawer__footer">
            <app-button type="button" variant="secondary" (click)="onClose()">Cancel</app-button>
            <app-button type="submit" [loading]="saving()" [disabled]="form.invalid">Create</app-button>
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
    .form-field { display: flex; flex-direction: column; gap: var(--space-2); }
    .form-field__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
    .colour-palette { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .colour-swatch {
      width: 28px; height: 28px; border-radius: var(--radius-sm);
      border: 2px solid transparent; cursor: pointer; transition: transform 0.1s;
    }
    .colour-swatch:hover { transform: scale(1.15); }
    .colour-swatch--selected { border-color: var(--color-text-primary); transform: scale(1.15); }
    .colour-custom { width: 40px; height: 28px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; padding: 2px; }
    .drawer__error { background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: var(--space-3); color: var(--color-danger); font-size: var(--font-size-sm); }
    .drawer__footer { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: auto; padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
  `]
})
export class CreateTagDrawerComponent implements OnChanges {
  readonly open = input(false);
  readonly close = output<void>();
  readonly saved = output<TagAdminDto>();

  private readonly tagsService = inject(AdminTagsService);
  private readonly toast = inject(ToastService);

  readonly presets = PRESET_COLOURS;
  readonly saving = signal(false);
  readonly serverError = signal('');

  readonly form = new FormGroup({
    name: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    colour: new FormControl('#3b82f6', { validators: [Validators.required], nonNullable: true })
  });

  ngOnChanges(): void {
    if (!this.open()) {
      this.form.reset({ name: '', colour: '#3b82f6' });
      this.serverError.set('');
    }
  }

  nameError(): string {
    const ctrl = this.form.controls.name;
    if (ctrl.touched && ctrl.errors?.['required']) return 'Tag name is required';
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
    const body: CreateTagRequest = this.form.getRawValue();
    this.tagsService.createTag(body).subscribe({
      next: tag => {
        this.saving.set(false);
        this.toast.success(`Tag "${tag.name}" created`);
        this.saved.emit(tag);
      },
      error: () => {
        this.saving.set(false);
        this.serverError.set('Failed to create tag');
      }
    });
  }
}
