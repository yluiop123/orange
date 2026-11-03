import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '../../../core/translate.pipe';
import { SystemApi, type RolePayload } from '../../../core/system-api.service';
import { applyServerFieldErrors, serverErrorOf } from '../../../core/form-errors';
import { ReferenceDataService } from '../../../core/reference-data.service';
import { PermissionPickerComponent } from '../../../shared/system/permission-picker.component';

export interface RoleDialogData {
  mode: 'add' | 'edit';
  id?: string;
}

@Component({
  selector: 'app-role-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    PermissionPickerComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ (data.mode === 'add' ? 'button.add' : 'button.edit') | t }}</h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="28" /></div>
      } @else {
        <form [formGroup]="form" class="dialog-form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'page.system.role.header.role' | t }}</mat-label>
            <input matInput formControlName="id" autocomplete="off" />
            @if (form.controls.id.touched && form.controls.id.invalid) {
              <mat-error>{{ 'validate.role' | t }}</mat-error>
            }
            @if (serverErrorOf(form.controls.id); as error) {
              <mat-error>{{ error }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'page.system.role.header.name' | t }}</mat-label>
            <input matInput formControlName="name" autocomplete="off" />
            @if (form.controls.name.touched && form.controls.name.invalid) {
              <mat-error>{{ 'validate.roleName' | t }}</mat-error>
            }
            @if (serverErrorOf(form.controls.name); as error) {
              <mat-error>{{ error }}</mat-error>
            }
          </mat-form-field>

          <div class="picker-label">{{ 'page.system.role.header.permissions' | t }}</div>
          <app-permission-picker
            [permissions]="form.controls.permissions.value"
            (selectedChange)="form.controls.permissions.setValue($event)"
          />
        </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close(false)">
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
        min-width: min(520px, 78vw);
      }
      .picker-label {
        font-size: 0.8rem;
        font-weight: 600;
        margin-bottom: -4px;
      }
      .loading {
        display: grid;
        place-items: center;
        min-height: 160px;
      }
    `,
  ],
})
export class RoleDialogComponent {
  readonly ref = inject<MatDialogRef<RoleDialogComponent, boolean>>(MatDialogRef);
  readonly data = inject<RoleDialogData>(MAT_DIALOG_DATA);
  readonly serverErrorOf = serverErrorOf;

  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SystemApi);
  private readonly reference = inject(ReferenceDataService);

  readonly pending = signal(false);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    id: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{2,32}$/)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    permissions: this.fb.nonNullable.control<string[]>([]),
  });

  constructor() {
    if (this.data.mode === 'edit' && this.data.id) {
      this.loading.set(true);
      this.api.getRole(this.data.id).subscribe({
        next: (role) => {
          this.form.patchValue({
            id: role.id,
            name: role.name,
            permissions: role.permissions ?? [],
          });
          this.form.controls.id.disable();
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const payload: RolePayload = {
      id: value.id,
      name: value.name,
      permissions: value.permissions,
    };
    this.pending.set(true);

    if (this.data.mode === 'add') {
      this.api.createRole(payload).subscribe({
        next: () => {
          this.pending.set(false);
          this.reference.invalidateRoles();
          this.ref.close(true);
        },
        error: (error) => {
          this.pending.set(false);
          applyServerFieldErrors(this.form, error);
        },
      });
    } else if (this.data.id) {
      this.api.updateRole(this.data.id, payload).subscribe({
        next: () => {
          this.pending.set(false);
          this.reference.invalidateRoles();
          this.ref.close(true);
        },
        error: (error) => {
          this.pending.set(false);
          applyServerFieldErrors(this.form, error);
        },
      });
    }
  }
}
