import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly currentUser = signal<AuthUser | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  constructor() {
    this.hydrateFromStorage();
  }

  login(email: string, password: string): Observable<void> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        this.currentUser.set(response.user);
      }),
      tap(() => this.router.navigate(['/dashboard'])) as never
    ) as Observable<void>;
  }

  logout(): void {
    this.clearAuth();
    window.location.href = '/login';
  }

  clearAuth(): void {
    localStorage.removeItem('token');
    this.currentUser.set(null);
  }

  updateCurrentUser(user: Partial<AuthUser>): void {
    const current = this.currentUser();
    if (current) {
      this.currentUser.set({ ...current, ...user });
    }
  }

  private hydrateFromStorage(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      if (Date.now() >= expiry) {
        this.clearAuth();
        return;
      }
      // Restore minimal user from token; full profile loaded via GET /api/auth/me
      this.currentUser.set({
        id: payload.sub,
        email: payload.email,
        displayName: payload.email, // placeholder until /me loads
        role: payload.role as 'USER' | 'ADMIN'
      });
      // Fetch full profile to get displayName
      this.http.get<AuthUser>('/api/auth/me').subscribe({
        next: user => this.currentUser.set(user),
        error: () => this.clearAuth()
      });
    } catch {
      this.clearAuth();
    }
  }
}
