import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResult } from '../contacts/contacts.service';

export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  NOTE: 'Note',
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  CALL: '📞',
  EMAIL: '✉️',
  MEETING: '📅',
  NOTE: '📝',
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  CALL: '#2563eb',
  EMAIL: '#7c3aed',
  MEETING: '#059669',
  NOTE: '#d97706',
};

export interface ActivityDto {
  id: string;
  type: ActivityType;
  subject: string;
  notes: string | null;
  activityDate: string;
  authorId: string | null;
  authorName: string | null;
  contactId: string | null;
  contactName: string | null;
  dealId: string | null;
  dealTitle: string | null;
  createdAt: string;
}

export interface CreateActivityRequest {
  type: ActivityType;
  subject: string;
  notes?: string;
  activityDate?: string;
  contactId?: string;
  dealId?: string;
}

export interface ActivityFilterParams {
  contactId?: string;
  dealId?: string;
  type?: ActivityType | '';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  private readonly http = inject(HttpClient);

  getActivities(params: ActivityFilterParams = {}): Observable<PageResult<ActivityDto>> {
    let httpParams = new HttpParams();
    if (params.contactId) httpParams = httpParams.set('contactId', params.contactId);
    if (params.dealId)    httpParams = httpParams.set('dealId', params.dealId);
    if (params.type)      httpParams = httpParams.set('type', params.type);
    if (params.dateFrom)  httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo)    httpParams = httpParams.set('dateTo', params.dateTo);
    if (params.page != null) httpParams = httpParams.set('page', String(params.page));
    return this.http.get<PageResult<ActivityDto>>('/api/activities', { params: httpParams });
  }

  createActivity(body: CreateActivityRequest): Observable<ActivityDto> {
    return this.http.post<ActivityDto>('/api/activities', body);
  }

  deleteActivity(id: string): Observable<void> {
    return this.http.delete<void>(`/api/activities/${id}`);
  }
}
