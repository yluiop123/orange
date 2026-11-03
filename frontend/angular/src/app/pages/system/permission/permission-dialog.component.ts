import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '../../../core/translate.pipe';
import { SystemApi } from '../../../core/system-api.service';
import { I18nService } from '../../../core/i18n.service';
import { ReferenceDataService } from '../../../core/reference-data.service';
import { applyServerFieldErrors, serverErrorOf } from '../../../core/form-errors';
import {
  checkTreeCode,
  treeCodeIssueMessageKey,
  treeCodeIssueValues,
} from '../../../core/tree-code';

export interface PermissionDialogData {
  mode: 'add' | 'edit';
  id?: string;
  parentId?: string | null;
}

const PERMISSION_TYPES = ['directory', 'menu', 'action'] as const;

@Component({
  selector: 'app-permission-dialog',
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
  ],
  template: `
    <h2 mat-dialog-title>
      {{ (data.mode === 'add' ? 'button.addChild' : 'button.edit') | t }}
    </h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="28" /></div>
      } @else {
        <form [formGroup]="form" class="dialog-form" (ngSubmit)="submit()">
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'page.system.permission.header.id' | t }}</mat-label>
              <input matInput formControlName="id" autocomplete="off" />
              @if (codeError()) {
                <mat-error>{{ codeError() }}</mat-error>
              }
              @if (serverErrorOf(form.controls.id); as error) {
                <mat-error>{{ error }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'page.system.permission.header.name' | t }}</mat-label>
              <input matInput formControlName="name" autocomplete="off" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <mat-error>{{ 'validate.name' | t }}</mat-error>
              }
              @if (serverErrorOf(form.controls.name); as error) {
                <mat-error>{{ error }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'page.system.permission.header.path' | t }}</mat-label>
              <input matInput formControlName="path" autocomplete="off" placeholder="/system/user" />
              @if (form.controls.path.touched && form.controls.path.invalid) {
                <mat-error>{{ 'validate.path' | t }}</mat-error>
              }
              @if (serverErrorOf(form.controls.path); as error) {
                <mat-error>{{ error }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'page.system.permission.header.type' | t }}</mat-label>
              <mat-select formControlName="type" (selectionChange)="onTypeChange()">
                @for (type of types; track type) {
                  <mat-option [value]="type">{{ ('dict.permissionType.' + type) | t }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'page.system.permission.header.action' | t }}</mat-label>
              <input matInput formControlName="action" autocomplete="off" placeholder="add" />
              @if (form.controls.action.hasError('actionRequired')) {
                <mat-error>{{ 'validate.action' | t }}</mat-error>
              }
              @if (form.controls.action.hasError('actionForbidden')) {
                <mat-error>{{ 'validate.actionForbidden' | t }}</mat-error>
              }
              @if (serverErrorOf(form.controls.action); as error) {
                <mat-error>{{ error }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'page.system.permission.header.parentPermission' | t }}</mat-label>
              <input matInput [value]="parentId() || '-'" disabled />
            </mat-form-field>
          </div>
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
        min-width: min(600px, 80vw);
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0 14px;
      }
      .loading {
        display: grid;
        place-items: center;
        min-height: 160px;
      }
      @media (max-width: 640px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PermissionDialogComponent {
  readonly ref = inject<MatDialogRef<PermissionDialogComponent, boolean>>(MatDialogRef);
  readonly data = inject<PermissionDialogData>(MAT_DIALOG_DATA);
  readonly serverErrorOf = serverErrorOf;
  readonly types = PERMISSION_TYPES;

  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SystemApi);
  private readonly i18n = inject(I18nService);
  private readonly reference = inject(ReferenceDataService);

  readonly pending = signal(false);
  readonly loading = signal(false);
  readonly parentId = signal<string | null>(this.data.parentId ?? null);

  readonly form = this.fb.nonNullable.group(
    {
      id: ['', [Validators.required, (control: AbstractControl) => this.codeValidator(control)]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      path: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9/]{2,}$/)]],
      type: ['menu' as (typeof PERMISSION_TYPES)[number], Validators.required],
      action: [''],
    },
    { validators: actionPolicy },
  );

  constructor() {
    // 把跨字段规则同时挂到 action 控件上，Material 才会在字段下显示错误
    this.form.controls.action.addValidators(actionFieldPolicy);
    if (this.data.mode === 'edit' && this.data.id) {
      this.loading.set(true);
      this.api.getPermission(this.data.id).subscribe({
        next: (permission) => {
          this.form.patchValue({
            id: permission.id,
            name: permission.name,
            path: permission.path,
            type: permission.type,
            action: permission.action ?? '',
          });
          this.form.controls.id.disable();
          this.parentId.set(permission.parentId ?? null);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  codeValidator(control: AbstractControl): ValidationErrors | null {
    if (this.data.mode === 'edit') return null;
    const issue = checkTreeCode('permission', String(control.value ?? ''), this.parentId());
    if (!issue) return null;
    return {
      code: this.i18n.t(
        treeCodeIssueMessageKey('permission', issue),
        treeCodeIssueValues(issue),
      ),
    };
  }

  codeError(): string | null {
    const control = this.form.controls.id;
    if (!control.touched || !control.invalid) return null;
    const code = control.errors?.['code'];
    if (typeof code === 'string') return code;
    return this.i18n.t('validate.permissionCode.required');
  }

  onTypeChange(): void {
    if (this.form.controls.type.value !== 'action') {
      this.form.controls.action.setValue('');
    }
    this.form.controls.action.updateValueAndValidity();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.pending.set(true);
    const value = this.form.getRawValue();
    const payload = {
      id: value.id,
      name: value.name,
      path: value.path,
      type: value.type,
      action: value.type === 'action' ? value.action : null,
      parentId: this.parentId(),
    };

    if (this.data.mode === 'add') {
      this.api.addPermissionChild(payload).subscribe({
        next: () => {
          this.pending.set(false);
          this.reference.invalidatePermissions();
          this.ref.close(true);
        },
        error: (error) => {
          this.pending.set(false);
          applyServerFieldErrors(this.form, error);
        },
      });
    } else if (this.data.id) {
      this.api.updatePermission(this.data.id, payload).subscribe({
        next: () => {
          this.pending.set(false);
          this.reference.invalidatePermissions();
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

function actionPolicy(group: AbstractControl): ValidationErrors | null {
  const type = group.get('type')?.value;
  const action = String(group.get('action')?.value ?? '').trim();
  if (type === 'action' && !action) return { actionRequired: true };
  if (type !== 'action' && action) return { actionForbidden: true };
  return null;
}

function actionFieldPolicy(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const type = parent.get('type')?.value;
  const action = String(control.value ?? '').trim();
  if (type === 'action' && !action) return { actionRequired: true };
  if (type !== 'action' && action) return { actionForbidden: true };
  return null;
}
