import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n.service';
import { NotificationService } from '../core/notification.service';
import { TranslatePipe } from '../core/translate.pipe';
import { serverErrorOf } from '../core/form-errors';

export interface ChangePasswordData {
  forced: boolean;
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ (data.forced ? 'password.change.force.title' : 'password.change.title') | t }}
    </h2>
    <mat-dialog-content>
      <p class="hint">
        {{ (data.forced ? 'password.change.force.desc' : 'password.change.desc') | t }}
      </p>
      <form [formGroup]="form" class="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'password.change.old' | t }}</mat-label>
          <input matInput type="password" autocomplete="current-password" formControlName="oldPassword" />
          @if (form.controls.oldPassword.touched && form.controls.oldPassword.invalid) {
            <mat-error>{{ 'validate.required' | t }}</mat-error>
          }
          @if (serverErrorOf(form.controls.oldPassword); as error) {
            <mat-error>{{ error }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'password.change.new' | t }}</mat-label>
          <input matInput type="password" autocomplete="new-password" formControlName="newPassword" />
          @if (form.controls.newPassword.touched && form.controls.newPassword.invalid) {
            <mat-error>{{ 'password.change.min' | t }}</mat-error>
          }
          @if (serverErrorOf(form.controls.newPassword); as error) {
            <mat-error>{{ error }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'password.change.confirm' | t }}</mat-label>
          <input matInput type="password" autocomplete="new-password" formControlName="confirmPassword" />
          @if (form.controls.confirmPassword.touched && form.controls.confirmPassword.invalid) {
            <mat-error>{{ 'password.change.mismatch' | t }}</mat-error>
          }
          @if (serverErrorOf(form.controls.confirmPassword); as error) {
            <mat-error>{{ error }}</mat-error>
          }
        </mat-form-field>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (!data.forced) {
        <button mat-button type="button" (click)="ref.close(false)">
          {{ 'button.cancel' | t }}
        </button>
      }
      <button mat-flat-button type="button" [disabled]="submitting()" (click)="submit()">
        {{ 'password.change.submit' | t }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .hint {
        margin: 0 0 16px;
        color: var(--mat-sys-on-surface-variant, #5f6368);
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: min(360px, 72vw);
      }
      .error {
        margin: 0;
        color: var(--mat-sys-error, #b3261e);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class ChangePasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrorOf = serverErrorOf;

  readonly ref = inject<MatDialogRef<ChangePasswordDialogComponent, boolean>>(MatDialogRef);
  readonly data = inject<ChangePasswordData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group(
    {
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchPasswords },
  );

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      if (this.form.errors?.['mismatch']) this.error.set(this.i18n.t('password.change.mismatch'));
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    try {
      const { oldPassword, newPassword } = this.form.getRawValue();
      await this.auth.changePassword(oldPassword, newPassword);
      this.notify.success(this.i18n.t('password.change.success'));
      this.ref.close(true);
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      const message = (error as { message?: string } | null)?.message;
      this.error.set(message || this.i18n.t('login.failed'));
    } finally {
      this.submitting.set(false);
    }
  }
}

function matchPasswords(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { mismatch: true }
    : null;
}
