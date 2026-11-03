import { Component, input } from '@angular/core';
import { TranslatePipe } from '../core/translate.pipe';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <header class="page-header">
      <div class="titles">
        <h1>{{ titleKey() | t }}</h1>
        @if (descKey()) {
          <p>{{ descKey() | t }}</p>
        }
      </div>
      <div class="page-actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      p {
        margin: 0.25rem 0 0;
        color: var(--app-muted-foreground);
        font-size: 0.8125rem;
      }
      .page-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class PageHeaderComponent {
  readonly titleKey = input.required<string>();
  readonly descKey = input<string>('');
}
