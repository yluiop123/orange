import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../core/auth.service';
import { findMenuNode } from '../core/menu';

/**
 * Redirects a menu container (or the root) to the first leaf the current
 * role can actually see. Re-runs when the role view changes.
 */
@Component({
  selector: 'app-menu-redirect',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="page-loading">
      <mat-spinner diameter="28" />
    </div>
  `,
})
export class MenuRedirectComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const nodePath = (this.route.snapshot.data as { nodePath?: string }).nodePath;
    let target: string | null;
    if (nodePath) {
      const node = findMenuNode(this.auth.visibleMenus(), nodePath);
      target = node
        ? node.children.length > 0
          ? this.auth.access().firstVisibleLeaf(node.children)
          : node.path
        : null;
    } else {
      target = this.auth.firstVisibleLeaf();
    }

    void this.router.navigateByUrl(target ?? '/forbidden', { replaceUrl: true });
  }
}
