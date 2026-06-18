import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserAdminDto {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  initialPassword: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);

  listUsers(): Observable<UserAdminDto[]> {
    return this.http.get<UserAdminDto[]>('/api/admin/users');
  }

  createUser(body: CreateUserRequest): Observable<UserAdminDto> {
    return this.http.post<UserAdminDto>('/api/admin/users', body);
  }

  updateRole(id: string, role: UserRole): Observable<UserAdminDto> {
    return this.http.put<UserAdminDto>(`/api/admin/users/${id}/role`, { role });
  }

  updateStatus(id: string, status: UserStatus): Observable<UserAdminDto> {
    return this.http.put<UserAdminDto>(`/api/admin/users/${id}/status`, { status });
  }
}
