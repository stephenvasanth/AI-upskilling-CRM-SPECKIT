import { Component, ChangeDetectionStrategy, OnChanges, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivitiesService, ActivityType, ACTIVITY_TYPE_LABELS } from '../activities.service';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-log-activity-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DrawerComponent, ButtonComponent, InputComponent],
  template: `
    <app-drawer
      [open]="open()"
      title="Log Activity"
      (closed)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="log-form">

        <div class="field">
          <label class="field__label">Type *</label>
          <div class="type-selector" role="group" aria-label="Activity type">
            @for (opt of typeOptions; track opt.value) {
              <button
                type="button"
                class="type-btn"
                [class.type-btn--active]="form.controls.type.value === opt.value"
                (click)="form.controls.type.setValue(opt.value)"
              >{{ opt.label }}</button>
            }
          </div>
        </div>

        <app-input
          label="Subject *"
          formControlName="subject"
          [errorMessage]="subjectError()"
          inputId="activity-subject"
        />

        <div class="field">
          <label for="activity-notes" class="field__label">Notes</label>
          <textarea
            id="activity-notes"
            formControlName="notes"
            rows="4"
            class="field__textarea"
            placeholder="Add notes…"
          ></textarea>
        </div>

        <div class="field">
          <label for="activity-date" class="field__label">Date &amp; time</label>
          <input
            id="activity-date"
            type="datetime-local"
            formControlName="activityDate"
            class="field__input"
          />
          <span class="field__hint">Leave blank to use current date/time</span>
        </div>

        @if (contextLabel()) {
          <div class="context-chip">
            <span class="context-chip__label">{{ contextType() }}</span>
            <span class="context-chip__value">{{ contextLabel() }}</span>
          </div>
        }

        @if (serverError()) {
          <p class="log-form__error" role="alert">{{ serverError() }}</p>
        }

        <div class="log-form__actions">
          <app-button type="button" variant="secondary" (click)="close.emit()">Cancel</app-button>
          <app-button type="submit" [loading]="saving()">Log Activity</app-button>
        </div>
      </form>
    </app-drawer>
  `,
  styles: [`
    .log-form { display: flex; flex-direction: column; gap: var(--space-4); }
    .log-form__error { color: var(--color-danger); font-size: var(--font-size-sm); }
    .log-form__actions { display: flex; justify-content: flex-end; gap: var(--space-2); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); }
    .field__input, .field__textarea { padding: 0 var(--space-3); height: 40px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base); color: var(--color-text-primary); background: var(--color-surface); outline: none; }
    .field__textarea { height: auto; padding: var(--space-2) var(--space-3); resize: vertical; font-family: inherit; }
    .field__input:focus, .field__textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-light); }
    .field__hint { font-size: var(--font-size-xs); color: var(--color-text-disabled); }
    .type-selector { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .type-btn { padding: var(--space-1) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--font-size-sm); background: var(--color-surface); color: var(--color-text-secondary); cursor: pointer; transition: all var(--duration-fast); }
    .type-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .type-btn--active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
    .context-chip { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); background: var(--color-background); border-radius: var(--radius-md); font-size: var(--font-size-sm); }
    .context-chip__label { font-weight: var(--font-weight-medium); color: var(--color-text-secondary); }
    .context-chip__value { color: var(--color-text-primary); }
  `]
})
export class LogActivityDrawerComponent implements OnChanges {
  private readonly activitiesService = inject(ActivitiesService);
  private readonly toast = inject(ToastService);

  readonly open = input(false);
  readonly contactId = input<string | null>(null);
  readonly contactName = input<string | null>(null);
  readonly dealId = input<string | null>(null);
  readonly dealTitle = input<string | null>(null);

  readonly close = output<void>();
  readonly saved = output<void>();

  readonly saving = signal(false);
  readonly serverError = signal('');

  readonly typeOptions = (Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map(v => ({
    value: v,
    label: ACTIVITY_TYPE_LABELS[v]
  }));

  readonly form = new FormGroup({
    type:         new FormControl<ActivityType>('CALL', { nonNullable: true }),
    subject:      new FormControl('', { validators: [Validators.required, Validators.maxLength(255)], nonNullable: true }),
    notes:        new FormControl('', { nonNullable: true }),
    activityDate: new FormControl('', { nonNullable: true }),
  });

  contextType(): string {
    if (this.contactId()) return 'Contact';
    if (this.dealId()) return 'Deal';
    return '';
  }

  contextLabel(): string | null {
    return this.contactName() ?? this.dealTitle() ?? null;
  }

  ngOnChanges(): void {
    if (!this.open()) {
      this.form.reset({ type: 'CALL' });
      this.serverError.set('');
      this.saving.set(false);
    }
  }

  subjectError(): string {
    const ctrl = this.form.controls.subject;
    if (!ctrl.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Subject is required';
    if (ctrl.errors['maxlength']) return 'Subject is too long';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.serverError.set('');

    const { type, subject, notes, activityDate } = this.form.getRawValue();
    const body = {
      type,
      subject,
      notes: notes || undefined,
      activityDate: activityDate ? new Date(activityDate).toISOString() : undefined,
      contactId: this.contactId() ?? undefined,
      dealId: this.dealId() ?? undefined,
    };

    this.activitiesService.createActivity(body).subscribe({
      next: () => {
        this.toast.success('Activity logged');
        this.saved.emit();
        this.close.emit();
      },
      error: () => {
        this.saving.set(false);
        this.serverError.set('Failed to log activity. Please try again.');
      }
    });
  }
}
