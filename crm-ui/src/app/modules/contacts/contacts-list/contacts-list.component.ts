import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs/operators';
import { ContactsService, ContactSummary, PageResult } from '../contacts.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

interface TagFilter { id: string; name: string; colour: string; }

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, BadgeComponent, AvatarComponent],
  template: `
    <div class="contacts-page">
      <div class="contacts-page__header">
        <div>
          <h1 class="contacts-page__title">Contacts</h1>
          @if (result()) {
            <p class="contacts-page__count">{{ result()!.totalElements }} contacts</p>
          }
        </div>
        <a routerLink="/contacts/new">
          <app-button>+ New Contact</app-button>
        </a>
      </div>

      <div class="contacts-page__filters">
        <div class="search-box">
          <input
            class="search-box__input"
            type="search"
            placeholder="Search by name, email or company…"
            [formControl]="searchCtrl"
            aria-label="Search contacts"
          />
        </div>

        @if (tagFilters().length > 0) {
          <div class="tag-filters">
            <button
              type="button"
              class="tag-filter"
              [class.tag-filter--active]="!selectedTagId()"
              (click)="selectTag(null)"
            >All</button>
            @for (tag of tagFilters(); track tag.id) {
              <button
                type="button"
                class="tag-filter"
                [class.tag-filter--active]="selectedTagId() === tag.id"
                (click)="selectTag(tag.id)"
              >
                <span class="tag-filter__dot" [style.background]="tag.colour"></span>
                {{ tag.name }}
              </button>
            }
          </div>
        }
      </div>

      @if (loading()) {
        <div class="contacts-page__loading" aria-live="polite">Loading…</div>
      } @else if (result() && result()!.content.length === 0) {
        <div class="empty-state">
          <p class="empty-state__message">No contacts match your search</p>
          <p class="empty-state__hint">Try a different name, email, or clear your filters.</p>
        </div>
      } @else if (result()) {
        <div class="contacts-table-wrapper">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="contacts-table__th">Name</th>
                <th class="contacts-table__th">Email</th>
                <th class="contacts-table__th">Company</th>
                <th class="contacts-table__th">Tags</th>
                <th class="contacts-table__th">Added</th>
              </tr>
            </thead>
            <tbody>
              @for (contact of result()!.content; track contact.id) {
                <tr class="contacts-table__row" (click)="openContact(contact)" role="button" tabindex="0" (keydown.enter)="openContact(contact)">
                  <td class="contacts-table__td">
                    <div class="contact-name">
                      <app-avatar [name]="contact.firstName + ' ' + contact.lastName" [size]="32" />
                      <span>{{ contact.firstName }} {{ contact.lastName }}</span>
                    </div>
                  </td>
                  <td class="contacts-table__td contacts-table__td--secondary">{{ contact.email || '—' }}</td>
                  <td class="contacts-table__td contacts-table__td--secondary">{{ contact.company || '—' }}</td>
                  <td class="contacts-table__td">
                    <div class="tag-list">
                      @for (tag of contact.tags; track tag.id) {
                        <app-badge [color]="tag.colour + '22'" [textColor]="tag.colour">{{ tag.name }}</app-badge>
                      }
                    </div>
                  </td>
                  <td class="contacts-table__td contacts-table__td--secondary">{{ formatDate(contact.createdAt) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (result()!.totalPages > 1) {
          <div class="pagination">
            <app-button variant="secondary" [disabled]="page() === 0" (click)="goToPage(page() - 1)">Previous</app-button>
            <span class="pagination__info">Page {{ page() + 1 }} of {{ result()!.totalPages }}</span>
            <app-button variant="secondary" [disabled]="page() + 1 >= result()!.totalPages" (click)="goToPage(page() + 1)">Next</app-button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .contacts-page { padding: var(--space-8); }
    .contacts-page__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .contacts-page__title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .contacts-page__count { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--space-1); }
    .contacts-page__filters { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
    .contacts-page__loading { padding: var(--space-8); text-align: center; color: var(--color-text-secondary); }
    .search-box { max-width: 400px; }
    .search-box__input { width: 100%; height: 40px; padding: 0 var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base); background: var(--color-surface); outline: none; }
    .search-box__input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-light); }
    .tag-filters { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .tag-filter { display: inline-flex; align-items: center; gap: var(--space-1); padding: 4px var(--space-3); border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-background); font-size: var(--font-size-sm); cursor: pointer; transition: border-color var(--duration-fast), background var(--duration-fast); }
    .tag-filter:hover { border-color: var(--color-primary); }
    .tag-filter--active { border-color: var(--color-primary); background: var(--color-primary-light); color: var(--color-primary); font-weight: var(--font-weight-medium); }
    .tag-filter__dot { width: 8px; height: 8px; border-radius: var(--radius-full); }
    .empty-state { text-align: center; padding: var(--space-12); color: var(--color-text-secondary); }
    .empty-state__message { font-size: var(--font-size-md); font-weight: var(--font-weight-medium); }
    .empty-state__hint { margin-top: var(--space-2); font-size: var(--font-size-sm); }
    .contacts-table-wrapper { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
    .contacts-table { width: 100%; border-collapse: collapse; }
    .contacts-table__th { padding: var(--space-3) var(--space-4); text-align: left; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border); background: var(--color-background); }
    .contacts-table__row { cursor: pointer; transition: background var(--duration-fast); }
    .contacts-table__row:hover { background: var(--color-background); }
    .contacts-table__td { padding: var(--space-3) var(--space-4); font-size: var(--font-size-base); color: var(--color-text-primary); border-bottom: 1px solid var(--color-border); }
    .contacts-table__td--secondary { color: var(--color-text-secondary); }
    .contact-name { display: flex; align-items: center; gap: var(--space-3); font-weight: var(--font-weight-medium); }
    .tag-list { display: flex; flex-wrap: wrap; gap: var(--space-1); }
    .pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-4); padding: var(--space-4); }
    .pagination__info { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
  `]
})
export class ContactsListComponent implements OnInit, OnDestroy {
  private readonly contactsService = inject(ContactsService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly searchCtrl = new FormControl('', { nonNullable: true });
  readonly selectedTagId = signal<string | null>(null);
  readonly page = signal(0);
  readonly loading = signal(true);
  readonly result = signal<PageResult<ContactSummary> | null>(null);
  readonly tagFilters = signal<TagFilter[]>([]);

  ngOnInit(): void {
    this.http.get<TagFilter[]>('/api/tags').pipe(catchError(() => of([]))).subscribe(tags => {
      this.tagFilters.set(tags);
    });

    this.searchCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.page.set(0);
      this.loadContacts();
    });
  }

  selectTag(tagId: string | null): void {
    this.selectedTagId.set(tagId);
    this.page.set(0);
    this.loadContacts();
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadContacts();
  }

  openContact(contact: ContactSummary): void {
    this.router.navigate(['/contacts', contact.id]);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private loadContacts(): void {
    this.loading.set(true);
    this.contactsService.getContacts({
      page: this.page(),
      search: this.searchCtrl.value || undefined,
      tagId: this.selectedTagId() ?? undefined,
    }).subscribe({
      next: result => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
