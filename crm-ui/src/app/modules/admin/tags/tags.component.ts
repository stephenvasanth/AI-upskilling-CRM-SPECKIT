import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { AdminTagsService, TagAdminDto } from '../admin-tags.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { CreateTagDrawerComponent } from '../create-tag-drawer/create-tag-drawer.component';

@Component({
  selector: 'app-tags',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, ModalComponent, CreateTagDrawerComponent],
  template: `
    <div class="admin-page">
      <div class="admin-page__header">
        <h1 class="admin-page__title">Tags</h1>
        <app-button (click)="createOpen.set(true)">+ Create Tag</app-button>
      </div>

      @if (loading()) {
        <p class="admin-page__loading">Loading…</p>
      } @else if (tags().length === 0) {
        <p class="admin-page__empty">No tags created yet.</p>
      } @else {
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Colour</th>
                <th>Name</th>
                <th>Contacts</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (tag of tags(); track tag.id) {
                <tr>
                  <td><span class="colour-swatch" [style.background]="tag.colour"></span></td>
                  <td class="data-table__name">{{ tag.name }}</td>
                  <td class="data-table__count">{{ tag.contactCount }}</td>
                  <td class="data-table__date">{{ formatDate(tag.createdAt) }}</td>
                  <td>
                    <button class="delete-btn" (click)="confirmDelete(tag)" aria-label="Delete tag">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <app-create-tag-drawer
      [open]="createOpen()"
      (close)="createOpen.set(false)"
      (saved)="onTagCreated($event)"
    />

    <app-modal
      [open]="!!deleteTarget()"
      title="Delete Tag"
      [message]="'Delete tag ' + (deleteTarget()?.name ?? '') + '? It will be removed from all contacts.'"
      confirmLabel="Delete"
      confirmVariant="danger"
      (confirm)="deleteConfirmed()"
      (cancel)="deleteTarget.set(null)"
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
    .data-table__name { font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
    .data-table__count, .data-table__date { color: var(--color-text-secondary); }
    .colour-swatch { display: inline-block; width: 20px; height: 20px; border-radius: var(--radius-sm); border: 1px solid rgba(0,0,0,0.1); }
    .delete-btn {
      font-size: var(--font-size-xs); padding: 4px var(--space-3);
      border-radius: var(--radius-sm); border: 1px solid #fecaca;
      color: #b91c1c; background: none; cursor: pointer;
    }
    .delete-btn:hover { background: #fef2f2; }
  `]
})
export class TagsComponent implements OnInit {
  private readonly tagsService = inject(AdminTagsService);
  private readonly toast = inject(ToastService);

  readonly tags = signal<TagAdminDto[]>([]);
  readonly loading = signal(true);
  readonly createOpen = signal(false);
  readonly deleteTarget = signal<TagAdminDto | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.tagsService.getTags().subscribe({
      next: tags => {
        this.tags.set(tags);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onTagCreated(tag: TagAdminDto): void {
    this.tags.update(list => [...list, tag].sort((a, b) => a.name.localeCompare(b.name)));
    this.createOpen.set(false);
  }

  confirmDelete(tag: TagAdminDto): void {
    this.deleteTarget.set(tag);
  }

  deleteConfirmed(): void {
    const tag = this.deleteTarget();
    if (!tag) return;
    this.tagsService.deleteTag(tag.id).subscribe({
      next: () => {
        this.tags.update(list => list.filter(t => t.id !== tag.id));
        this.deleteTarget.set(null);
        this.toast.success(`Tag "${tag.name}" deleted`);
      },
      error: () => {
        this.deleteTarget.set(null);
        this.toast.error('Failed to delete tag');
      }
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
