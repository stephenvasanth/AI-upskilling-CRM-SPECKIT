import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info', durationMs = 4000): void {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(list => {
      const next = [...list, { id, type, message }];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'error'); }
  info(message: string): void { this.show(message, 'info'); }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
