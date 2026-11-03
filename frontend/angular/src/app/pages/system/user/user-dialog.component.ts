import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '../../../core/translate.pipe';
import { SystemApi, type UserPayload } from '../../../core/system-api.service';
import { ReferenceDataService } from '../../../core/reference-data.service';
import { applyServerFieldErrors, serverErrorOf } from '../../../core/form-errors';
import { GroupSelectComponent } from '../../../shared/system/group-select.component';
import { PermissionPickerComponent } from '../../../shared/system/permission-picker.component';
import type { Role, User } from '../../../core/models';

export interface UserDialogData {
  mode: 'add' | 'edit';
  id?: string;
}

export interface UserDialogResult {
  saved: boolean;
  password?: string;
  username?: string;
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    GroupSelectComponent,
    PermissionPickerComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ (data.mode === 'add' ? 'button.add' : 'button.edit') | t }}</h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="28" /></div>
      } @else {
        <form [formGroup]="form" class="dialog-form" (ngSubmit)="submit()">
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'page.system.user.header.userName' | t }}</mat-label>
              <input matInput formControlName="username" autocomplete="off" />
              @if (form.controls.username.touched && form.controls.username.invalid) {
                <mat-error>{{ 'validate.username' | t }}</mat-error>
              }
              @if (serverErrorOf(form.controls.username); as error) {
                <mat-error>{{ error }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'page.system.user.header.name' | t }}</mat-label>
              <input matInput formControlName="name" autocomplete="off" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <mat-error>{{ 'validate.name' | t }}</mat-error>
              }
              @if (serverErrorOf(form.controls.name); as error) {
                <mat-error>{{ error }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'page.system.user.header.email' | t }}</mat-label>
              <input matInput formControlName="email" autocomplete="off" />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <mat-error>{{ 'validate.email' | t }}</mat-error>
              }
              @if (serverErrorOf(form.controls.email); as error) {
                <mat-error>{{ error }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'page.system.user.header.phone' | t }}</mat-label>
              <input matInput formControlName="phone" autocomplete="off" />
              @if (form.controls.phone.touched && form.controls.phone.invalid) {
                <mat-error>{{ 'validate.phone' | t }}</mat-error>
              }
              @if (serverErrorOf(form.controls.phone); as error) {
                <mat-error>{{ error }}</mat-error>
              }
            </mat-form-field>
          </div>

          <app-group-select
            [value]="form.controls.groupId.value"
            [allowEmpty]="false"
            [label]="'page.system.user.header.groupName'"
            (valueChange)="form.controls.groupId.setValue($event); form.controls.groupId.markAsTouched()"
          />
          @if (form.controls.groupId.touched && form.controls.groupId.invalid) {
            <p class="field-error">{{ 'validate.groupRequired' | t }}</p>
          }
          @if (serverErrorOf(form.controls.groupId); as error) {
            <p class="field-error">{{ error }}</p>
          }

          <mat-form-field appearance="outline">
            <mat-label>{{ 'page.system.user.header.roles' | t }}</mat-label>
            <mat-select formControlName="roles" multiple>
              @for (role of roles(); track role.id) {
                <mat-option [value]="role.id">{{ role.name }} ({{ role.id }})</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <div class="picker-label">{{ 'page.system.user.header.permissions' | t }}</div>
          <app-permission-picker
            [permissions]="form.controls.permissions.value"
            (selectedChange)="form.controls.permissions.setValue($event)"
          />
        </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close({ saved: false })">
        {{ 'button.cancel' | t }}
      </button>
      <button mat-flat-button type="button" [disabled]="pending() || loading()" (click)="submit()">
        {{ 'button.save' | t }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: min(560px, 78vw);
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0 14px;
      }
      .picker-label {
        font-size: 0.8rem;
        font-weight: 600;
        margin-bottom: -4px;
      }
      .loading {
        display: grid;
        place-items: center;
        min-height: 180px;
      }
      .field-error {
        margin: -8px 0 0;
        color: var(--mat-sys-error, #b3261e);
        font-size: 0.75rem;
      }
      @media (max-width: 620px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class UserDialogComponent {
  readonly ref = inject<MatDialogRef<UserDialogComponent, UserDialogResult>>(MatDialogRef);
  readonly data = inject<UserDialogData>(MAT_DIALOG_DATA);
  readonly serverErrorOf = serverErrorOf;

  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SystemApi);
  private readonly reference = inject(ReferenceDataService);

  readonly pending = signal(false);
  readonly loading = signal(false);
  readonly roles = signal<Role[]>([]);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_]{4,50}$/)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^1[3-9]\d{9}$/)]],
    groupId: ['', Validators.required],
    roles: this.fb.nonNullable.control<string[]>([]),
    permissions: this.fb.nonNullable.control<string[]>([]),
  });

  constructor() {
    this.reference.ensureRoles().subscribe((roles) => this.roles.set(roles ?? []));

    if (this.data.mode === 'edit' && this.data.id) {
      this.loading.set(true);
      this.api.getUser(this.data.id).subscribe({
        next: (user) => {
          this.patch(user);
          this.form.controls.username.disable();
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  private patch(user: User): void {
    this.form.patchValue({
      username: user.username ?? '',
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      groupId: user.groupId ?? '',
      roles: (user.roles ?? []).map((role) => role.id),
      permissions: user.permissions ?? [],
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const payload: UserPayload = {
      username: value.username,
      name: value.name,
      email: value.email,
      phone: value.phone,
      groupId: value.groupId,
      roles: value.roles,
      permissions: value.permissions,
    };

    this.pending.set(true);
    if (this.data.mode === 'add') {
      this.api.createUser(payload).subscribe({
        next: (password) => {
          this.pending.set(false);
          this.ref.close({ saved: true, password, username: value.username });
        },
        error: (error) => {
          this.pending.set(false);
          applyServerFieldErrors(this.form, error);
        },
      });
    } else if (this.data.id) {
      this.api.updateUser(this.data.id, payload).subscribe({
        next: () => {
          this.pending.set(false);
          this.ref.close({ saved: true });
        },
        error: (error) => {
          this.pending.set(false);
          applyServerFieldErrors(this.form, error);
        },
      });
    }
  }
}
