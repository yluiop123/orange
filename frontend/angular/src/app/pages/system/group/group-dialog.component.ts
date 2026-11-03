import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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

export interface GroupDialogData {
  mode: 'add' | 'edit';
  id?: string;
  parentId?: string | null;
}

@Component({
  selector: 'app-group-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
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
          <mat-form-field appearance="outline">
            <mat-label>{{ 'page.system.group.header.id' | t }}</mat-label>
            <input matInput formControlName="id" autocomplete="off" />
            @if (codeError()) {
              <mat-error>{{ codeError() }}</mat-error>
            }
            @if (serverErrorOf(form.controls.id); as error) {
              <mat-error>{{ error }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'page.system.group.header.name' | t }}</mat-label>
            <input matInput formControlName="name" autocomplete="off" />
            @if (form.controls.name.touched && form.controls.name.invalid) {
              <mat-error>{{ 'validate.groupName' | t }}</mat-error>
            }
            @if (serverErrorOf(form.controls.name); as error) {
              <mat-error>{{ error }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'page.system.group.header.parentGroup' | t }}</mat-label>
            <input matInput [value]="parentId() || '-'" disabled />
          </mat-form-field>
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
        min-width: min(420px, 76vw);
      }
      .loading {
        display: grid;
        place-items: center;
        min-height: 150px;
      }
    `,
  ],
})
export class GroupDialogComponent {
  readonly ref = inject<MatDialogRef<GroupDialogComponent, boolean>>(MatDialogRef);
  readonly data = inject<GroupDialogData>(MAT_DIALOG_DATA);
  readonly serverErrorOf = serverErrorOf;

  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SystemApi);
  private readonly i18n = inject(I18nService);
  private readonly reference = inject(ReferenceDataService);

  readonly pending = signal(false);
  readonly loading = signal(false);
  readonly parentId = signal<string | null>(this.data.parentId ?? null);

  readonly form = this.fb.nonNullable.group({
    id: ['', [Validators.required, (control: AbstractControl) => this.codeValidator(control)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
  });

  constructor() {
    if (this.data.mode === 'edit' && this.data.id) {
      this.loading.set(true);
      this.api.getGroup(this.data.id).subscribe({
        next: (group) => {
          this.form.patchValue({ id: group.id, name: group.name });
          this.form.controls.id.disable();
          this.parentId.set(group.parentId ?? null);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  codeValidator(control: AbstractControl): ValidationErrors | null {
    if (this.data.mode === 'edit') return null;
    const issue = checkTreeCode('group', String(control.value ?? ''), this.parentId());
    if (!issue) return null;
    return {
      code: this.i18n.t(
        treeCodeIssueMessageKey('group', issue),
        treeCodeIssueValues(issue),
      ),
    };
  }

  codeError(): string | null {
    const control = this.form.controls.id;
    if (!control.touched || !control.invalid) return null;
    const code = control.errors?.['code'];
    if (typeof code === 'string') return code;
    return this.i18n.t('validate.groupCode.required');
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.pending.set(true);
    const value = this.form.getRawValue();

    if (this.data.mode === 'add') {
      this.api
        .addGroupChild({
          id: value.id,
          name: value.name,
          parentId: this.parentId() ?? undefined,
        })
        .subscribe({
          next: () => {
            this.pending.set(false);
            this.reference.invalidateGroups();
            this.ref.close(true);
          },
          error: (error) => {
            this.pending.set(false);
            applyServerFieldErrors(this.form, error);
          },
        });
    } else if (this.data.id) {
      this.api.updateGroup(this.data.id, { name: value.name }).subscribe({
        next: () => {
          this.pending.set(false);
          this.reference.invalidateGroups();
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
