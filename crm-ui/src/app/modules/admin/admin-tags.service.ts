import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TagAdminDto {
  id: string;
  name: string;
  colour: string;
  contactCount: number;
  createdAt: string;
}

export interface CreateTagRequest {
  name: string;
  colour: string;
}

@Injectable({ providedIn: 'root' })
export class AdminTagsService {
  private readonly http = inject(HttpClient);

  getTags(): Observable<TagAdminDto[]> {
    return this.http.get<TagAdminDto[]>('/api/admin/tags');
  }

  createTag(body: CreateTagRequest): Observable<TagAdminDto> {
    return this.http.post<TagAdminDto>('/api/admin/tags', body);
  }

  deleteTag(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/tags/${id}`);
  }
}
