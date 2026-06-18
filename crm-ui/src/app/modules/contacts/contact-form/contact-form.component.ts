import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ContactsService, CompanyDto } from '../contacts.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

interface UserSummary { id: string; displayName: string; }
interface TagOption { id: string; name: string; colour: string; selected: boolean; }

@Component({
  selector: 'app-contact-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent, BadgeComponent],
  template: `
    <div class="form-page">
      <div class="form-page__header">
        <a routerLink="/contacts" class="form-page__back">← Contacts</a>
        <h1 class="form-page__title">{{ isEditMode() ? 'Edit Contact' : 'New Contact' }}</h1>
      </div>

      @if (loadError()) {
        <div class="form-page__error" role="alert">Failed to load contact. <a routerLink="/contacts">Return to contacts</a></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-card" novalidate>
          <div class="form-card__section">
            <h2 class="form-card__section-title">Basic Information</h2>
            <div class="form-card__row">
              <app-input
                label="First name *"
                formControlName="firstName"
                [errorMessage]="fieldError('firstName')"
                inputId="firstName"
              />
              <app-input
                label="Last name *"
                formControlName="lastName"
                [errorMessage]="fieldError('lastName')"
                inputId="lastName"
              />
            </div>
            <div class="form-card__row">
              <app-input
                label="Email"
                type="email"
                formControlName="email"
                [errorMessage]="fieldError('email')"
                inputId="email"
              />
              <app-input
                label="Phone"
                formControlName="phone"
                inputId="phone"
              />
            </div>
            <app-input
              label="Job title"
              formControlName="jobTitle"
              inputId="jobTitle"
            />
          </div>

          <div class="form-card__section">
            <h2 class="form-card__section-title">Organisation</h2>
            <div class="form-card__row">
              <div class="field">
                <label for="companyId" class="field__label">Company</label>
                <select id="companyId" formControlName="companyId" class="field__select">
                  <option value="">— None —</option>
                  @for (c of companies(); track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label for="ownerId" class="field__label">Owner</label>
                <select id="ownerId" formControlName="ownerId" class="field__select">
                  <option value="">— Unassigned —</option>
                  @for (u of users(); track u.id) {
                    <option [value]="u.id">{{ u.displayName }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <div class="form-card__section">
            <h2 class="form-card__section-title">Tags</h2>
            <div class="tag-picker">
              @for (tag of tagOptions(); track tag.id) {
                <button
                  type="button"
                  class="tag-picker__item"
                  [class.tag-picker__item--selected]="tag.selected"
                  (click)="toggleTag(tag)"
                >
                  <span class="tag-picker__dot" [style.background]="tag.colour"></span>
                  {{ tag.name }}
                </button>
              }
              @if (tagOptions().length === 0) {
                <p class="form-card__hint">No tags available. Create tags in Admin → Tags.</p>
              }
            </div>
          </div>

          @if (serverError()) {
            <div class="form-card__error" role="alert">{{ serverError() }}</div>
          }

          <div class="form-card__actions">
            <a routerLink="/contacts">
              <app-button type="button" variant="secondary">Cancel</app-button>
            </a>
            <app-button type="submit" [loading]="saving()">
              {{ isEditMode() ? 'Save Changes' : 'Create Contact' }}
            </app-button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .form-page { padding: var(--space-8); max-width: 800px; margin: 0 auto; }
    .form-page__header { margin-bottom: var(--space-6); }
    .form-page__back { font-size: var(--font-size-sm); color: var(--color-text-secondary); text-decoration: none; }
    .form-page__back:hover { color: var(--color-primary); }
    .form-page__title { margin-top: var(--space-2); font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .form-page__error { background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: var(--space-4); color: var(--color-danger); }
    .form-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
    .form-card__section { padding: var(--space-6); border-bottom: 1px solid var(--color-border); display: flex; flex-direction: column; gap: var(--space-4); }
    .form-card__section:last-of-type { border-bottom: none; }
    .form-card__section-title { font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin-bottom: var(--space-1); }
    .form-card__row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-card__hint { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
    .form-card__error { margin: 0 var(--space-6); padding: var(--space-3); background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); color: var(--color-danger); font-size: var(--font-size-sm); }
    .form-card__actions { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-6); }
    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); }
    .field__select { height: 40px; padding: 0 var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base); color: var(--color-text-primary); background: var(--color-surface); outline: none; }
    .field__select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-light); }
    .tag-picker { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .tag-picker__item { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-background); font-size: var(--font-size-sm); cursor: pointer; transition: border-color var(--duration-fast); }
    .tag-picker__item:hover { border-color: var(--color-primary); }
    .tag-picker__item--selected { border-color: var(--color-primary); background: var(--color-primary-light); color: var(--color-primary); }
    .tag-picker__dot { width: 8px; height: 8px; border-radius: var(--radius-full); flex-shrink: 0; }
  `]
})
export class ContactFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contactsService = inject(ContactsService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  readonly isEditMode = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal(false);
  readonly serverError = signal('');
  readonly companies = signal<CompanyDto[]>([]);
  readonly users = signal<UserSummary[]>([]);
  readonly tagOptions = signal<TagOption[]>([]);

  private contactId: string | null = null;

  readonly form = new FormGroup({
    firstName: new FormControl('', { validators: [Validators.required, Validators.maxLength(100)], nonNullable: true }),
    lastName:  new FormControl('', { validators: [Validators.required, Validators.maxLength(100)], nonNullable: true }),
    email:     new FormControl('', { validators: [Validators.email, Validators.maxLength(255)],   nonNullable: true }),
    phone:     new FormControl('', { nonNullable: true }),
    jobTitle:  new FormControl('', { nonNullable: true }),
    companyId: new FormControl('', { nonNullable: true }),
    ownerId:   new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.contactId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.contactId);

    forkJoin({
      companies: this.contactsService.getCompanies().pipe(catchError(() => of([]))),
      users: this.http.get<UserSummary[]>('/api/users').pipe(catchError(() => of([]))),
      tags: this.http.get<{id:string;name:string;colour:string}[]>('/api/tags').pipe(catchError(() => of([]))),
    }).subscribe(({ companies, users, tags }) => {
      this.companies.set(companies);
      this.users.set(users);
      this.tagOptions.set(tags.map(t => ({ ...t, selected: false })));

      if (this.contactId) {
        this.contactsService.getContact(this.contactId).subscribe({
          next: contact => {
            this.form.patchValue({
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email ?? '',
              phone: contact.phone ?? '',
              jobTitle: contact.jobTitle ?? '',
              companyId: contact.companyId ?? '',
              ownerId: contact.ownerId ?? '',
            });
            const selectedIds = new Set(contact.tags.map(t => t.id));
            this.tagOptions.update(opts => opts.map(o => ({ ...o, selected: selectedIds.has(o.id) })));
          },
          error: () => this.loadError.set(true)
        });
      }
    });
  }

  toggleTag(tag: TagOption): void {
    this.tagOptions.update(opts =>
      opts.map(o => o.id === tag.id ? { ...o, selected: !o.selected } : o)
    );
  }

  fieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return `${this.fieldLabel(field)} is required`;
    if (ctrl.errors['email']) return 'Must be a valid email address';
    if (ctrl.errors['maxlength']) return `Too long`;
    return '';
  }

  private fieldLabel(field: string): string {
    const labels: Record<string, string> = { firstName: 'First name', lastName: 'Last name', email: 'Email' };
    return labels[field] ?? field;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.serverError.set('');

    const { firstName, lastName, email, phone, jobTitle, companyId, ownerId } = this.form.getRawValue();
    const tagIds = this.tagOptions().filter(t => t.selected).map(t => t.id);

    const body = {
      firstName, lastName,
      email: email || undefined,
      phone: phone || undefined,
      jobTitle: jobTitle || undefined,
      companyId: companyId || undefined,
      ownerId: ownerId || undefined,
      tagIds: tagIds.length ? tagIds : undefined,
    };

    const request$ = this.contactId
      ? this.contactsService.updateContact(this.contactId, body)
      : this.contactsService.createContact(body);

    request$.subscribe({
      next: contact => {
        this.toast.success(this.contactId ? 'Contact updated' : 'Contact created');
        this.router.navigate(['/contacts', contact.id]);
      },
      error: () => {
        this.saving.set(false);
        this.serverError.set('Failed to save contact. Please try again.');
      }
    });
  }
}
