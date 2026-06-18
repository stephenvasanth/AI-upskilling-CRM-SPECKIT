import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResult } from '../contacts/contacts.service';

export type TaskStatus = 'PENDING' | 'COMPLETED';
export type TaskFilter = 'ALL' | 'MY_TASKS' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED';

export const TASK_FILTER_LABELS: Record<TaskFilter, string> = {
  ALL: 'All',
  MY_TASKS: 'My Tasks',
  OVERDUE: 'Overdue',
  TODAY: 'Due Today',
  UPCOMING: 'Upcoming',
  COMPLETED: 'Completed',
};

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: TaskStatus;
  assigneeId: string | null;
  assigneeName: string | null;
  contactId: string | null;
  contactName: string | null;
  dealId: string | null;
  dealTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate: string;
  assigneeId: string;
  contactId?: string;
  dealId?: string;
}

export type UpdateTaskRequest = CreateTaskRequest;

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);

  getTasks(filter: TaskFilter = 'ALL', page = 0): Observable<PageResult<TaskDto>> {
    const params = new HttpParams().set('filter', filter).set('page', String(page));
    return this.http.get<PageResult<TaskDto>>('/api/tasks', { params });
  }

  getTask(id: string): Observable<TaskDto> {
    return this.http.get<TaskDto>(`/api/tasks/${id}`);
  }

  getTasksByContact(contactId: string): Observable<TaskDto[]> {
    return this.http.get<TaskDto[]>(`/api/tasks/by-contact/${contactId}`);
  }

  createTask(body: CreateTaskRequest): Observable<TaskDto> {
    return this.http.post<TaskDto>('/api/tasks', body);
  }

  updateTask(id: string, body: UpdateTaskRequest): Observable<TaskDto> {
    return this.http.put<TaskDto>(`/api/tasks/${id}`, body);
  }

  toggleTask(id: string, status: TaskStatus): Observable<TaskDto> {
    return this.http.patch<TaskDto>(`/api/tasks/${id}/status`, { status });
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`/api/tasks/${id}`);
  }
}
