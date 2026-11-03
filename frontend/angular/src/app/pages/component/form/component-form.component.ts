import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../shared/page-header.component';

@Component({
  selector: 'app-component-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page">
      <app-page-header titleKey="page.component.form.title" descKey="page.component.form.desc" />
      <div class="form-layout">
        <section class="panel">
          <form [formGroup]="form" (ngSubmit)="submit()" class="form">
            <div class="two-col">
              <mat-form-field appearance="outline">
                <mat-label>Full name</mat-label>
                <input matInput formControlName="name" autocomplete="name" />
                <mat-icon matPrefix>person</mat-icon>
                @if (form.controls.name.touched && form.controls.name.invalid) {
                  <mat-error>Name must be at least 2 characters</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" autocomplete="email" />
                <mat-icon matPrefix>mail</mat-icon>
                @if (form.controls.email.touched && form.controls.email.invalid) {
                  <mat-error>Enter a valid email address</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="admin">Administrator</mat-option>
                  <mat-option value="editor">Editor</mat-option>
                  <mat-option value="viewer">Viewer</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Start date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="startDate" />
                <mat-datepicker-toggle matIconSuffix [for]="picker" />
                <mat-datepicker #picker />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Country</mat-label>
                <input matInput formControlName="country" [matAutocomplete]="countries" />
                <mat-autocomplete #countries="matAutocomplete">
                  @for (country of countryList; track country) {
                    <mat-option [value]="country">{{ country }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Monthly budget</mat-label>
                <input matInput type="number" formControlName="budget" />
                <span matTextPrefix>$&nbsp;</span>
                <span matTextSuffix>.00</span>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Bio</mat-label>
              <textarea matInput rows="3" formControlName="bio" maxlength="240"></textarea>
              <mat-hint align="end">{{ form.controls.bio.value.length }} / 240</mat-hint>
            </mat-form-field>

            <div class="radio-row">
              <span class="field-label">Plan</span>
              <mat-radio-group formControlName="plan">
                <mat-radio-button value="starter">Starter</mat-radio-button>
                <mat-radio-button value="pro">Pro</mat-radio-button>
                <mat-radio-button value="enterprise">Enterprise</mat-radio-button>
              </mat-radio-group>
            </div>

            <div class="toggle-row">
              <mat-checkbox formControlName="terms">I accept the terms</mat-checkbox>
              <mat-slide-toggle formControlName="newsletter">Weekly newsletter</mat-slide-toggle>
            </div>

            <div class="slider-row">
              <span class="field-label">Seats: {{ form.controls.seats.value }}</span>
              <mat-slider min="1" max="50" step="1" discrete showTickMarks>
                <input matSliderThumb formControlName="seats" />
              </mat-slider>
            </div>

            <div class="actions">
              <button mat-button type="button" (click)="reset()">Reset</button>
              <button mat-flat-button type="submit">Save form</button>
            </div>
          </form>
        </section>

        <aside class="panel">
          <h2>Live value</h2>
          <p class="muted">Reactive form state, including validation status.</p>
          <pre class="json">{{ summary() }}</pre>
          <p class="muted">{{ form.valid ? 'Form is valid' : 'Form is incomplete' }}</p>
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      .form-layout {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
        gap: 16px;
        align-items: start;
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 14px;
      }
      .radio-row,
      .toggle-row,
      .slider-row {
        display: flex;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
        padding: 6px 0;
      }
      .field-label {
        font-size: 0.82rem;
        font-weight: 600;
        min-width: 64px;
      }
      .slider-row {
        flex-direction: column;
        align-items: stretch;
        gap: 4px;
      }
      .slider-row mat-slider {
        width: 100%;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 6px;
      }
      .json {
        margin: 0;
        padding: 12px;
        border-radius: 10px;
        background: var(--mat-sys-surface-container-low, #f7f8fa);
        font-size: 0.72rem;
        white-space: pre-wrap;
        word-break: break-all;
      }
      h2 {
        font-size: 0.95rem;
      }
      @media (max-width: 860px) {
        .form-layout,
        .two-col {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ComponentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly countryList = ['China', 'Japan', 'Singapore', 'Germany', 'United States', 'Australia'];
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['Ada Lovelace', [Validators.required, Validators.minLength(2)]],
    email: ['ada@example.com', [Validators.required, Validators.email]],
    role: ['editor', Validators.required],
    startDate: [new Date(), Validators.required],
    country: ['China', Validators.required],
    budget: [1200, [Validators.required, Validators.min(0)]],
    bio: ['Mathematician and first programmer.', Validators.maxLength(240)],
    plan: ['pro', Validators.required],
    terms: [false, Validators.requiredTrue],
    newsletter: [true],
    seats: [12],
  });

  summary(): string {
    const value = this.form.getRawValue();
    return JSON.stringify(
      {
        ...value,
        startDate: value.startDate instanceof Date ? value.startDate.toISOString().slice(0, 10) : value.startDate,
      },
      null,
      2,
    );
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.snackBar.open('Please fix the highlighted fields', undefined, { duration: 3000 });
      return;
    }
    this.submitted.set(true);
    this.snackBar.open('Form submitted', undefined, { duration: 2500 });
  }

  reset(): void {
    this.form.reset({
      name: '',
      email: '',
      role: 'viewer',
      startDate: new Date(),
      country: '',
      budget: 0,
      bio: '',
      plan: 'starter',
      terms: false,
      newsletter: false,
      seats: 5,
    });
  }
}
