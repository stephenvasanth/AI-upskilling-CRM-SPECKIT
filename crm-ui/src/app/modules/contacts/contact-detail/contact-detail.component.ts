import { Component, ChangeDetectionStrategy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactsService, ContactDto } from '../contacts.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ActivityFeedComponent } from '../../../shared/components/activity-feed/activity-feed.component';

import { LogActivityDrawerComponent } from '../../activities/log-activity-drawer/log-activity-drawer.component';
import { TasksService, TaskDto } from '../../tasks/tasks.service';
import { TaskDrawerComponent } from '../../tasks/task-drawer/task-drawer.component';
import { DealsService, DealDto, STAGE_LABELS } from '../../deals/deals.service';

const STAGE_COLOURS: Record<string, string> = {
  LEAD: '#94A3B8',
  QUALIFIED: '#3B82F6',
  PROPOSAL: '#8B5CF6',
  NEGOTIATION: '#F59E0B',
  CLOSED_WON: '#10B981',
  CLOSED_LOST: '#EF4444',
};

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe, ButtonComponent, BadgeComponent, AvatarComponent, ModalComponent,
            ActivityFeedComponent, LogActivityDrawerComponent, TaskDrawerComponent],
  template: `
    <div class="detail-page">
      @if (loading()) {
        <div class="detail-page__loading" aria-live="polite">Loading…</div>
      } @else if (loadError()) {
        <div class="detail-page__error">
          <p>Contact not found.</p>
          <a routerLink="/contacts"><app-button variant="secondary">Back to Contacts</app-button></a>
        </div>
      } @else if (contact()) {
        <div class="detail-page__header">
          <a routerLink="/contacts" class="detail-page__back">← Contacts</a>
          <div class="detail-page__actions">
            <a [routerLink]="['/contacts', contact()!.id, 'edit']">
              <app-button variant="secondary">Edit</app-button>
            </a>
            <app-button variant="danger" (click)="showDeleteModal.set(true)">Delete</app-button>
          </div>
        </div>

        <div class="detail-layout">
          <!-- Left column: 3/5 -->
          <div class="detail-layout__main">
            <div class="detail-card">
              <div class="detail-card__avatar-row">
                <app-avatar [name]="contact()!.firstName + ' ' + contact()!.lastName" [size]="64" />
                <div>
                  <h1 class="detail-card__name">{{ contact()!.firstName }} {{ contact()!.lastName }}</h1>
                  @if (contact()!.jobTitle) {
                    <p class="detail-card__job-title">{{ contact()!.jobTitle }}</p>
                  }
                  @if (contact()!.companyName) {
                    <p class="detail-card__company">{{ contact()!.companyName }}</p>
                  }
                </div>
              </div>

              @if (contact()!.tags.length > 0) {
                <div class="detail-card__tags">
                  @for (tag of contact()!.tags; track tag.id) {
                    <app-badge [color]="tag.colour + '22'" [textColor]="tag.colour">{{ tag.name }}</app-badge>
                  }
                </div>
              }
            </div>

            <div class="detail-card">
              <h2 class="detail-card__section-title">Contact Information</h2>
              <dl class="detail-list">
                <div class="detail-list__item">
                  <dt class="detail-list__label">Email</dt>
                  <dd class="detail-list__value">
                    @if (contact()!.email) {
                      <a [href]="'mailto:' + contact()!.email" class="detail-list__link">{{ contact()!.email }}</a>
                    } @else { <span class="detail-list__empty">—</span> }
                  </dd>
                </div>
                <div class="detail-list__item">
                  <dt class="detail-list__label">Phone</dt>
                  <dd class="detail-list__value">
                    @if (contact()!.phone) { {{ contact()!.phone }} } @else { <span class="detail-list__empty">—</span> }
                  </dd>
                </div>
                <div class="detail-list__item">
                  <dt class="detail-list__label">Company</dt>
                  <dd class="detail-list__value">{{ contact()!.companyName || '—' }}</dd>
                </div>
                <div class="detail-list__item">
                  <dt class="detail-list__label">Owner</dt>
                  <dd class="detail-list__value">{{ contact()!.ownerName || '—' }}</dd>
                </div>
                <div class="detail-list__item">
                  <dt class="detail-list__label">Added</dt>
                  <dd class="detail-list__value">{{ formatDate(contact()!.createdAt) }}</dd>
                </div>
                <div class="detail-list__item">
                  <dt class="detail-list__label">Last updated</dt>
                  <dd class="detail-list__value">{{ formatDate(contact()!.updatedAt) }}</dd>
                </div>
              </dl>
            </div>

            <div class="detail-card">
              <h2 class="detail-card__section-title">Linked Deals</h2>
              @if (linkedDeals().length === 0) {
                <p class="detail-card__stub">No deals linked to this contact.</p>
              } @else {
                <ul class="linked-deals">
                  @for (deal of linkedDeals(); track deal.id) {
                    <li class="linked-deal">
                      <span class="linked-deal__title">{{ deal.title }}</span>
                      <span class="linked-deal__stage" [style.color]="stageColour(deal.stage)">{{ stageLabel(deal.stage) }}</span>
                      @if (deal.value) {
                        <span class="linked-deal__value">{{ deal.value | number:'1.0-0' }}</span>
                      }
                    </li>
                  }
                </ul>
              }
            </div>
          </div>

          <!-- Right column: 2/5 -->
          <div class="detail-layout__side">
            <div class="detail-card">
              <div class="detail-card__section-header">
                <h2 class="detail-card__section-title">Activity Feed</h2>
                <app-button variant="ghost" (click)="logActivityOpen.set(true)">+ Log Activity</app-button>
              </div>
              <app-activity-feed
                [contactId]="contact()!.id"
                [showLogCta]="true"
                #activityFeed
              />
            </div>

            <div class="detail-card">
              <div class="detail-card__section-header">
                <h2 class="detail-card__section-title">Tasks</h2>
                <app-button variant="ghost" (click)="newTaskOpen.set(true)">+ New Task</app-button>
              </div>
              @if (contactTasks().length === 0) {
                <p class="detail-card__stub">No tasks linked to this contact.</p>
              } @else {
                <ul class="contact-task-list">
                  @for (task of contactTasks(); track task.id) {
                    <li class="contact-task" [class.contact-task--done]="task.status === 'COMPLETED'">
                      <span class="contact-task__title">{{ task.title }}</span>
                      <span class="contact-task__due" [class.contact-task__due--overdue]="isOverdue(task)">{{ task.dueDate }}</span>
                    </li>
                  }
                </ul>
              }
            </div>
          </div>
        </div>
      }
    </div>

    <app-modal
      [open]="showDeleteModal()"
      title="Delete Contact"
      [message]="'Are you sure you want to delete ' + (contact()?.firstName ?? '') + ' ' + (contact()?.lastName ?? '') + '? This action cannot be undone. Linked activities will also be deleted.'"
      confirmLabel="Delete"
      confirmVariant="danger"
      (confirm)="deleteContact()"
      (cancel)="showDeleteModal.set(false)"
    />

    <app-log-activity-drawer
      [open]="logActivityOpen()"
      [contactId]="contact()?.id ?? null"
      [contactName]="contact() ? contact()!.firstName + ' ' + contact()!.lastName : null"
      (close)="logActivityOpen.set(false)"
      (saved)="activityFeedRef?.refresh()"
    />

    <app-task-drawer
      [open]="newTaskOpen()"
      [prefilledContactId]="contact()?.id ?? null"
      (close)="newTaskOpen.set(false)"
      (saved)="loadContactTasks()"
    />
  `,
  styles: [`
    .detail-page { padding: var(--space-8); }
    .detail-page__loading { padding: var(--space-8); text-align: center; color: var(--color-text-secondary); }
    .detail-page__error { padding: var(--space-8); text-align: center; color: var(--color-text-secondary); display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
    .detail-page__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); }
    .detail-page__back { font-size: var(--font-size-sm); color: var(--color-text-secondary); text-decoration: none; }
    .detail-page__back:hover { color: var(--color-primary); }
    .detail-page__actions { display: flex; gap: var(--space-2); }
    .detail-layout { display: grid; grid-template-columns: 3fr 2fr; gap: var(--space-6); align-items: start; }
    .detail-layout__main { display: flex; flex-direction: column; gap: var(--space-4); }
    .detail-layout__side { display: flex; flex-direction: column; gap: var(--space-4); }
    .detail-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: var(--space-6); }
    .detail-card__avatar-row { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4); }
    .detail-card__name { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .detail-card__job-title { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: 2px; }
    .detail-card__company { font-size: var(--font-size-sm); color: var(--color-primary); margin-top: 2px; }
    .detail-card__tags { display: flex; flex-wrap: wrap; gap: var(--space-1); }
    .detail-card__section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .detail-card__section-title { font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0; }
    .detail-card__stub { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
    .detail-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .detail-list__item { display: grid; grid-template-columns: 120px 1fr; gap: var(--space-2); }
    .detail-list__label { font-size: var(--font-size-sm); color: var(--color-text-secondary); padding-top: 1px; }
    .detail-list__value { font-size: var(--font-size-sm); color: var(--color-text-primary); }
    .detail-list__link { color: var(--color-primary); text-decoration: none; }
    .detail-list__link:hover { text-decoration: underline; }
    .detail-list__empty { color: var(--color-text-disabled); }
    .contact-task-list { list-style: none; display: flex; flex-direction: column; gap: var(--space-2); }
    .contact-task { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); }
    .contact-task:last-child { border-bottom: none; }
    .contact-task--done .contact-task__title { text-decoration: line-through; color: var(--color-text-disabled); }
    .contact-task__title { font-size: var(--font-size-sm); color: var(--color-text-primary); }
    .contact-task__due { font-size: var(--font-size-xs); color: var(--color-text-disabled); }
    .contact-task__due--overdue { color: #b91c1c; }
    .linked-deals { list-style: none; display: flex; flex-direction: column; gap: var(--space-2); }
    .linked-deal { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); }
    .linked-deal:last-child { border-bottom: none; }
    .linked-deal__title { flex: 1; font-size: var(--font-size-sm); color: var(--color-text-primary); font-weight: var(--font-weight-medium); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .linked-deal__stage { font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); }
    .linked-deal__value { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-left: auto; }
  `]
})
export class ContactDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contactsService = inject(ContactsService);
  private readonly tasksService = inject(TasksService);
  private readonly dealsService = inject(DealsService);
  private readonly toast = inject(ToastService);

  readonly contact = signal<ContactDto | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly showDeleteModal = signal(false);
  readonly logActivityOpen = signal(false);
  readonly newTaskOpen = signal(false);
  readonly contactTasks = signal<TaskDto[]>([]);
  readonly linkedDeals = signal<DealDto[]>([]);

  @ViewChild('activityFeed') activityFeedRef?: ActivityFeedComponent;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.contactsService.getContact(id).subscribe({
      next: c => {
        this.contact.set(c);
        this.loading.set(false);
        this.loadContactTasks();
        this.loadLinkedDeals(c.id);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      }
    });
  }

  loadContactTasks(): void {
    const id = this.contact()?.id;
    if (!id) return;
    this.tasksService.getTasksByContact(id).subscribe({
      next: tasks => this.contactTasks.set(tasks),
      error: () => {}
    });
  }

  loadLinkedDeals(contactId: string): void {
    this.dealsService.getDealsByContact(contactId).subscribe({
      next: deals => this.linkedDeals.set(deals),
      error: () => {}
    });
  }

  stageLabel(stage: string): string {
    return STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? stage;
  }

  stageColour(stage: string): string {
    return STAGE_COLOURS[stage] ?? '#64748B';
  }

  isOverdue(task: TaskDto): boolean {
    return task.status === 'PENDING' && task.dueDate < new Date().toISOString().split('T')[0];
  }

  deleteContact(): void {
    const id = this.contact()?.id;
    if (!id) return;
    this.contactsService.deleteContact(id).subscribe({
      next: () => {
        this.toast.success('Contact deleted');
        this.router.navigate(['/contacts']);
      },
      error: () => {
        this.showDeleteModal.set(false);
        this.toast.error('Failed to delete contact');
      }
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
