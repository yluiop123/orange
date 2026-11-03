import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="state-page">
      <div class="code">403</div>
      <mat-icon class="icon">gpp_bad</mat-icon>
      <h1>{{ 'forbidden.title' | t }}</h1>
      <p>{{ 'forbidden.desc' | t }}</p>
      <div class="actions">
        <button mat-stroked-button type="button" (click)="back()">
          <mat-icon>arrow_back</mat-icon>
          {{ 'forbidden.back' | t }}
        </button>
        <button mat-flat-button type="button" (click)="home()">
          <mat-icon>home</mat-icon>
          {{ 'forbidden.home' | t }}
        </button>
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
        color: var(--mat-sys-error, #b3261e);
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
      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
      }
    `,
  ],
})
export class ForbiddenComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  back(): void {
    this.location.back();
  }

  home(): void {
    const target = this.auth.firstVisibleLeaf();
    void this.router.navigateByUrl(target ?? '/login');
  }
}
