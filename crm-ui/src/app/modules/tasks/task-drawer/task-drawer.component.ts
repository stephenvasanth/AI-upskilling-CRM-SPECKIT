import { Component, ChangeDetectionStrategy, OnChanges, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TasksService, TaskDto } from '../tasks.service';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

interface UserSummary { id: string; displayName: string; }
interface ContactSummary { id: string; firstName: string; lastName: string; }

@Component({
  selector: 'app-task-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DrawerComponent, ButtonComponent, InputComponent, ModalComponent],
  template: `
    <app-drawer
      [open]="open()"
      [title]="editTask() ? 'Edit Task' : 'New Task'"
      (closed)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="task-form">
        <app-input
          label="Title *"
          formControlName="title"
          [errorMessage]="titleError()"
          inputId="task-title"
        />

        <div class="field">
          <label for="task-description" class="field__label">Description</label>
          <textarea
            id="task-description"
            formControlName="description"
            rows="3"
            class="field__textarea"
            placeholder="Optional description…"
          ></textarea>
        </div>

        <div class="field">
          <label for="task-due-date" class="field__label">Due date *</label>
          <input
            id="task-due-date"
            type="date"
            formControlName="dueDate"
            class="field__input"
            [class.field__input--error]="dueDateError()"
          />
          @if (dueDateError()) {
            <span class="field__error">{{ dueDateError() }}</span>
          }
        </div>

        <div class="field">
          <label for="task-assignee" class="field__label">Assignee *</label>
          <select id="task-assignee" formControlName="assigneeId" class="field__select"
                  [class.field__select--error]="assigneeError()">
            <option value="">— Select assignee —</option>
            @for (u of users(); track u.id) {
              <option [value]="u.id">{{ u.displayName }}</option>
            }
          </select>
          @if (assigneeError()) {
            <span class="field__error">{{ assigneeError() }}</span>
          }
        </div>

        <div class="field">
          <label for="task-contact" class="field__label">Contact</label>
          <select id="task-contact" formControlName="contactId" class="field__select">
            <option value="">— None —</option>
            @for (c of contacts(); track c.id) {
              <option [value]="c.id">{{ c.firstName }} {{ c.lastName }}</option>
            }
          </select>
        </div>

        @if (serverError()) {
          <p class="task-form__error" role="alert">{{ serverError() }}</p>
        }

        <div class="task-form__actions">
          @if (editTask()) {
            <app-button type="button" variant="danger" (click)="showDeleteModal.set(true)">Delete</app-button>
          }
          <div class="task-form__actions-right">
            <app-button type="button" variant="secondary" (click)="close.emit()">Cancel</app-button>
            <app-button type="submit" [loading]="saving()">
              {{ editTask() ? 'Save Changes' : 'Create Task' }}
            </app-button>
          </div>
        </div>
      </form>
    </app-drawer>

    <app-modal
      [open]="showDeleteModal()"
      title="Delete Task"
      [message]="'Delete ' + (editTask()?.title ?? '') + '? This cannot be undone.'"
      confirmLabel="Delete"
      confirmVariant="danger"
      (confirm)="deleteTask()"
      (cancel)="showDeleteModal.set(false)"
    />
  `,
  styles: [`
    .task-form { display: flex; flex-direction: column; gap: var(--space-4); }
    .task-form__error { color: var(--color-danger); font-size: var(--font-size-sm); }
    .task-form__actions { display: flex; justify-content: space-between; align-items: center; padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .task-form__actions-right { display: flex; gap: var(--space-2); }
    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); }
    .field__input, .field__select, .field__textarea { height: 40px; padding: 0 var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base); color: var(--color-text-primary); background: var(--color-surface); outline: none; }
    .field__textarea { height: auto; padding: var(--space-2) var(--space-3); resize: vertical; font-family: inherit; }
    .field__input:focus, .field__select:focus, .field__textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-light); }
    .field__input--error, .field__select--error { border-color: var(--color-danger); }
    .field__error { font-size: var(--font-size-xs); color: var(--color-danger); }
  `]
})
export class TaskDrawerComponent implements OnChanges {
  private readonly tasksService = inject(TasksService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  readonly open = input(false);
  readonly editTask = input<TaskDto | null>(null);
  readonly prefilledContactId = input<string | null>(null);

  readonly close = output<void>();
  readonly saved = output<void>();

  readonly saving = signal(false);
  readonly serverError = signal('');
  readonly showDeleteModal = signal(false);
  readonly users = signal<UserSummary[]>([]);
  readonly contacts = signal<ContactSummary[]>([]);

  readonly form = new FormGroup({
    title:       new FormControl('', { validators: [Validators.required, Validators.maxLength(255)], nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    dueDate:     new FormControl('', { validators: [Validators.required], nonNullable: true }),
    assigneeId:  new FormControl('', { validators: [Validators.required], nonNullable: true }),
    contactId:   new FormControl('', { nonNullable: true }),
    dealId:      new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.http.get<UserSummary[]>('/api/users').pipe(
      catchError(() => of([]))
    ).subscribe(u => this.users.set(u));

    this.http.get<any>('/api/contacts?size=200').pipe(
      catchError(() => of({ content: [] }))
    ).subscribe(res => this.contacts.set(res.content ?? []));
  }

  ngOnChanges(): void {
    if (!this.open()) {
      this.form.reset();
      this.serverError.set('');
      this.saving.set(false);
      this.showDeleteModal.set(false);
      return;
    }

    const task = this.editTask();
    if (task) {
      this.form.patchValue({
        title: task.title,
        description: task.description ?? '',
        dueDate: task.dueDate,
        assigneeId: task.assigneeId ?? '',
        contactId: task.contactId ?? '',
        dealId: task.dealId ?? '',
      });
    } else {
      this.form.reset({
        contactId: this.prefilledContactId() ?? '',
      });
    }
  }

  titleError(): string {
    const ctrl = this.form.controls.title;
    if (!ctrl.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Title is required';
    if (ctrl.errors['maxlength']) return 'Title is too long';
    return '';
  }

  dueDateError(): string {
    const ctrl = this.form.controls.dueDate;
    if (!ctrl.touched || !ctrl.errors) return '';
    return 'Due date is required';
  }

  assigneeError(): string {
    const ctrl = this.form.controls.assigneeId;
    if (!ctrl.touched || !ctrl.errors) return '';
    return 'Assignee is required';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.serverError.set('');

    const { title, description, dueDate, assigneeId, contactId, dealId } = this.form.getRawValue();
    const body = {
      title,
      description: description || undefined,
      dueDate,
      assigneeId,
      contactId: contactId || undefined,
      dealId: dealId || undefined,
    };

    const request$ = this.editTask()
      ? this.tasksService.updateTask(this.editTask()!.id, body)
      : this.tasksService.createTask(body);

    request$.subscribe({
      next: () => {
        this.toast.success(this.editTask() ? 'Task updated' : 'Task created');
        this.saved.emit();
        this.close.emit();
      },
      error: () => {
        this.saving.set(false);
        this.serverError.set('Failed to save task. Please try again.');
      }
    });
  }

  deleteTask(): void {
    const id = this.editTask()?.id;
    if (!id) return;
    this.tasksService.deleteTask(id).subscribe({
      next: () => {
        this.toast.success('Task deleted');
        this.saved.emit();
        this.close.emit();
      },
      error: () => {
        this.showDeleteModal.set(false);
        this.toast.error('Failed to delete task');
      }
    });
  }
}
