import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ForbiddenDialogComponent, type ForbiddenDialogData } from './forbidden-dialog.component';

/** Coalesces repeated 403s into one modal, like the React/Vue forbidden store. */
@Injectable({ providedIn: 'root' })
export class ForbiddenDialogService {
  private readonly dialog = inject(MatDialog);
  private openRef: MatDialogRef<ForbiddenDialogComponent> | null = null;

  show(path: string, message?: string): void {
    if (this.openRef) return;
    const data: ForbiddenDialogData = { path, message };
    this.openRef = this.dialog.open(ForbiddenDialogComponent, {
      data,
      width: '460px',
      maxWidth: '94vw',
      autoFocus: 'first-tabbable',
    });
    this.openRef.afterClosed().subscribe(() => {
      this.openRef = null;
    });
  }
}
