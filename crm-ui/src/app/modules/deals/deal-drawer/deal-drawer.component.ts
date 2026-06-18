import { Component, ChangeDetectionStrategy, OnInit, OnChanges, inject, input, output, signal, effect } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DealsService, DealDto, DealStage, STAGE_ORDER, STAGE_LABELS } from '../deals.service';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

interface ContactSummary { id: string; firstName: string; lastName: string; }
interface UserSummary { id: string; displayName: string; }

@Component({
  selector: 'app-deal-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DrawerComponent, ButtonComponent, InputComponent, ModalComponent],
  template: `
    <app-drawer
      [open]="open()"
      [title]="editDeal() ? 'Edit Deal' : 'New Deal'"
      (closed)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="deal-form">
        <app-input
          label="Title *"
          formControlName="title"
          [errorMessage]="titleError()"
          inputId="deal-title"
        />

        <div class="field">
          <label for="deal-stage" class="field__label">Stage *</label>
          <select id="deal-stage" formControlName="stage" class="field__select">
            @for (s of stageOptions; track s.value) {
              <option [value]="s.value">{{ s.label }}</option>
            }
          </select>
        </div>

        <app-input
          label="Value ($)"
          formControlName="value"
          inputId="deal-value"
        />

        <div class="field">
          <label for="deal-close-date" class="field__label">Expected close date</label>
          <input
            id="deal-close-date"
            type="date"
            formControlName="expectedCloseDate"
            class="field__input"
          />
        </div>

        <div class="field">
          <label for="deal-contact" class="field__label">Contact</label>
          <select id="deal-contact" formControlName="contactId" class="field__select">
            <option value="">— None —</option>
            @for (c of contacts(); track c.id) {
              <option [value]="c.id">{{ c.firstName }} {{ c.lastName }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label for="deal-owner" class="field__label">Owner</label>
          <select id="deal-owner" formControlName="ownerId" class="field__select">
            <option value="">— Unassigned —</option>
            @for (u of users(); track u.id) {
              <option [value]="u.id">{{ u.displayName }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label for="deal-notes" class="field__label">Notes</label>
          <textarea
            id="deal-notes"
            formControlName="notes"
            rows="4"
            class="field__textarea"
            placeholder="Key details, next steps…"
          ></textarea>
        </div>

        @if (serverError()) {
          <p class="deal-form__error" role="alert">{{ serverError() }}</p>
        }

        <div class="deal-form__actions">
          @if (editDeal()) {
            <app-button type="button" variant="danger" (click)="showDeleteModal.set(true)">Delete</app-button>
          }
          <div class="deal-form__actions-right">
            <app-button type="button" variant="secondary" (click)="close.emit()">Cancel</app-button>
            <app-button type="submit" [loading]="saving()">
              {{ editDeal() ? 'Save Changes' : 'Create Deal' }}
            </app-button>
          </div>
        </div>
      </form>
    </app-drawer>

    <app-modal
      [open]="showDeleteModal()"
      title="Delete Deal"
      [message]="'Delete ' + (editDeal()?.title ?? '') + '? This cannot be undone.'"
      confirmLabel="Delete"
      confirmVariant="danger"
      (confirm)="deleteDeal()"
      (cancel)="showDeleteModal.set(false)"
    />
  `,
  styles: [`
    .deal-form { display: flex; flex-direction: column; gap: var(--space-4); }
    .deal-form__error { color: var(--color-danger); font-size: var(--font-size-sm); }
    .deal-form__actions { display: flex; justify-content: space-between; align-items: center; padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .deal-form__actions-right { display: flex; gap: var(--space-2); }
    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); }
    .field__select, .field__input, .field__textarea { height: 40px; padding: 0 var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base); color: var(--color-text-primary); background: var(--color-surface); outline: none; }
    .field__textarea { height: auto; padding: var(--space-2) var(--space-3); resize: vertical; font-family: inherit; }
    .field__select:focus, .field__input:focus, .field__textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-light); }
  `]
})
export class DealDrawerComponent implements OnChanges {
  private readonly dealsService = inject(DealsService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  readonly open = input(false);
  readonly editDeal = input<DealDto | null>(null);
  readonly defaultStage = input<DealStage>('LEAD');

  readonly close = output<void>();
  readonly saved = output<void>();

  readonly saving = signal(false);
  readonly serverError = signal('');
  readonly showDeleteModal = signal(false);
  readonly contacts = signal<ContactSummary[]>([]);
  readonly users = signal<UserSummary[]>([]);

  readonly stageOptions = STAGE_ORDER.map(s => ({ value: s, label: STAGE_LABELS[s] }));

  readonly form = new FormGroup({
    title:             new FormControl('', { validators: [Validators.required, Validators.maxLength(255)], nonNullable: true }),
    stage:             new FormControl<DealStage>('LEAD', { nonNullable: true }),
    value:             new FormControl('', { nonNullable: true }),
    expectedCloseDate: new FormControl('', { nonNullable: true }),
    contactId:         new FormControl('', { nonNullable: true }),
    ownerId:           new FormControl('', { nonNullable: true }),
    notes:             new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.http.get<ContactSummary[]>('/api/contacts?size=200').pipe(
      catchError(() => of({ content: [] } as any))
    ).subscribe(res => this.contacts.set(res.content ?? res));

    this.http.get<UserSummary[]>('/api/users').pipe(
      catchError(() => of([]))
    ).subscribe(users => this.users.set(users));
  }

  ngOnChanges(): void {
    if (!this.open()) {
      this.form.reset();
      this.serverError.set('');
      this.saving.set(false);
      this.showDeleteModal.set(false);
      return;
    }

    const deal = this.editDeal();
    if (deal) {
      this.form.patchValue({
        title: deal.title,
        stage: deal.stage,
        value: deal.value != null ? String(deal.value) : '',
        expectedCloseDate: deal.expectedCloseDate ?? '',
        contactId: deal.contactId ?? '',
        ownerId: deal.ownerId ?? '',
        notes: deal.notes ?? '',
      });
    } else {
      this.form.reset({ stage: this.defaultStage() });
    }
  }

  titleError(): string {
    const ctrl = this.form.controls.title;
    if (!ctrl.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Title is required';
    if (ctrl.errors['maxlength']) return 'Title is too long';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.serverError.set('');

    const { title, stage, value, expectedCloseDate, contactId, ownerId, notes } = this.form.getRawValue();
    const body = {
      title,
      stage,
      value: value ? Number(value) : undefined,
      expectedCloseDate: expectedCloseDate || undefined,
      contactId: contactId || undefined,
      ownerId: ownerId || undefined,
      notes: notes || undefined,
    };

    const request$ = this.editDeal()
      ? this.dealsService.updateDeal(this.editDeal()!.id, body)
      : this.dealsService.createDeal(body);

    request$.subscribe({
      next: () => {
        this.toast.success(this.editDeal() ? 'Deal updated' : 'Deal created');
        this.saved.emit();
        this.close.emit();
      },
      error: () => {
        this.saving.set(false);
        this.serverError.set('Failed to save deal. Please try again.');
      }
    });
  }

  deleteDeal(): void {
    const id = this.editDeal()?.id;
    if (!id) return;
    this.dealsService.deleteDeal(id).subscribe({
      next: () => {
        this.toast.success('Deal deleted');
        this.saved.emit();
        this.close.emit();
      },
      error: () => {
        this.showDeleteModal.set(false);
        this.toast.error('Failed to delete deal');
      }
    });
  }
}
