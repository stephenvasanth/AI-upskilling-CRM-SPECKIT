import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TagDto {
  id: string;
  name: string;
  colour: string;
}

export interface CompanyDto {
  id: string;
  name: string;
}

export interface ContactSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  tags: TagDto[];
  createdAt: string;
}

export interface ContactDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  ownerId: string;
  ownerName: string;
  tags: TagDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ContactFilterParams {
  page?: number;
  size?: number;
  search?: string;
  tagId?: string;
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  companyId?: string;
  ownerId?: string;
  tagIds?: string[];
}

export type UpdateContactRequest = CreateContactRequest;

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private readonly http = inject(HttpClient);

  getContacts(params: ContactFilterParams = {}): Observable<PageResult<ContactSummary>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 0)
      .set('size', params.size ?? 20);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.tagId)  httpParams = httpParams.set('tagId', params.tagId);
    return this.http.get<PageResult<ContactSummary>>('/api/contacts', { params: httpParams });
  }

  getContact(id: string): Observable<ContactDto> {
    return this.http.get<ContactDto>(`/api/contacts/${id}`);
  }

  createContact(body: CreateContactRequest): Observable<ContactDto> {
    return this.http.post<ContactDto>('/api/contacts', body);
  }

  updateContact(id: string, body: UpdateContactRequest): Observable<ContactDto> {
    return this.http.put<ContactDto>(`/api/contacts/${id}`, body);
  }

  deleteContact(id: string): Observable<void> {
    return this.http.delete<void>(`/api/contacts/${id}`);
  }

  getCompanies(): Observable<CompanyDto[]> {
    return this.http.get<CompanyDto[]>('/api/companies');
  }
}
