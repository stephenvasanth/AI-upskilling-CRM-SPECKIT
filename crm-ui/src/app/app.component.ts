import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, SidebarComponent, ToastComponent],
  template: `
    <div class="app-shell">
      @if (auth.isAuthenticated()) {
        <app-sidebar />
      }
      <main class="app-main">
        <router-outlet />
      </main>
    </div>
    <app-toast />
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .app-main {
      flex: 1;
      overflow-y: auto;
      background-color: var(--color-background);
    }
  `]
})
export class AppComponent {
  readonly auth = inject(AuthService);
}
