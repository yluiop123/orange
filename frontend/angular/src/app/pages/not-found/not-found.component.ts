import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink, TranslatePipe],
  template: `
    <div class="state-page">
      <div class="code">404</div>
      <mat-icon class="icon">travel_explore</mat-icon>
      <h1>{{ 'notfound.title' | t }}</h1>
      <p>{{ 'notfound.desc' | t }}</p>
      <div class="actions">
        <a mat-flat-button routerLink="/" (click)="goHome($event)">
          <mat-icon>home</mat-icon>
          {{ 'notfound.home' | t }}
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      .state-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 100vh;
        padding: 24px;
        text-align: center;
        background: var(--mat-sys-surface-container-low, #f7f8fa);
      }
      .code {
        font-size: 5rem;
        font-weight: 800;
        letter-spacing: -0.05em;
        color: var(--mat-sys-outline-variant, #e3e5e8);
        line-height: 1;
      }
      .icon {
        font-size: 46px;
        width: 46px;
        height: 46px;
        color: var(--mat-sys-primary, #b45309);
      }
      h1 {
        margin: 0;
        font-size: 1.6rem;
      }
      p {
        max-width: 460px;
        margin: 0 0 8px;
        color: var(--mat-sys-on-surface-variant, #5f6368);
      }
    `,
  ],
})
export class NotFoundComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  goHome(event: Event): void {
    event.preventDefault();
    void this.router.navigateByUrl(this.auth.firstVisibleLeaf() ?? '/login');
  }
}
