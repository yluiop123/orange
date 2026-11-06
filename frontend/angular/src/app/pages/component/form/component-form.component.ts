import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

interface CascadeNode {
  value: string;
  label: string;
  children?: CascadeNode[];
}

const CASCADE_OPTIONS: CascadeNode[] = [
  {
    value: 'clothes',
    label: 'Clothing',
    children: [
      {
        value: 'mens',
        label: 'Men',
        children: [
          { value: 'tshirt', label: 'T-Shirt' },
          { value: 'suit', label: 'Suit' },
        ],
      },
      {
        value: 'womens',
        label: 'Women',
        children: [{ value: 'dress', label: 'Dress' }],
      },
    ],
  },
  {
    value: 'food',
    label: 'Food',
    children: [
      {
        value: 'fruit',
        label: 'Fruit',
        children: [
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ],
      },
      {
        value: 'vegetables',
        label: 'Vegetables',
        children: [
          { value: 'carrot', label: 'Carrot' },
          { value: 'broccoli', label: 'Broccoli' },
        ],
      },
    ],
  },
];

interface TreeGroup {
  value: string;
  title: string;
  children: { value: string; title: string }[];
}

const TREE_GROUPS: TreeGroup[] = [
  {
    value: 'asia',
    title: 'Asia',
    children: [
      { value: 'cn', title: 'China' },
      { value: 'jp', title: 'Japan' },
      { value: 'in', title: 'India' },
    ],
  },
  {
    value: 'europe',
    title: 'Europe',
    children: [
      { value: 'de', title: 'Germany' },
      { value: 'fr', title: 'France' },
      { value: 'uk', title: 'United Kingdom' },
    ],
  },
  {
    value: 'americas',
    title: 'Americas',
    children: [
      { value: 'us', title: 'United States' },
      { value: 'ca', title: 'Canada' },
    ],
  },
];

interface MentionUser {
  name: string;
  role: string;
  color: string;
}

const MENTION_USERS: MentionUser[] = [
  { name: 'Zhang San', role: 'Product Manager', color: '#6366f1' },
  { name: 'Li Si', role: 'Designer', color: '#ec4899' },
  { name: 'Wang Wu', role: 'Developer', color: '#0ea5e9' },
  { name: 'Zhao Liu', role: 'QA Engineer', color: '#f59e0b' },
  { name: 'Sun Qi', role: 'Project Manager', color: '#10b981' },
];

interface TransferItem {
  key: string;
  title: string;
  description: string;
  disabled?: boolean;
}

const TRANSFER_SOURCE: TransferItem[] = Array.from({ length: 12 }, (_, index) => ({
  key: String(index + 1),
  title: `Item ${index + 1}`,
  description: `Description ${index + 1}`,
  disabled: index % 7 === 0,
}));

interface UploadFileItem {
  name: string;
  size: number;
  progress: number;
}

interface SelectGroup {
  group: string;
  items: { value: string; label: string }[];
}

const SELECT_GROUPS: SelectGroup[] = [
  {
    group: 'Basic',
    items: [
      { value: 'text', label: 'Text' },
      { value: 'number', label: 'Number' },
      { value: 'date', label: 'Date' },
    ],
  },
  {
    group: 'Advanced',
    items: [
      { value: 'file', label: 'File' },
      { value: 'json', label: 'JSON' },
      { value: 'api', label: 'API' },
    ],
  },
];

@Component({
  selector: 'app-component-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTabsModule,
  ],
  template: `
    <div class="page">

      <mat-tab-group class="orange-tabs" animationDuration="0ms">
        <mat-tab label="AutoComplete">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Basic Usage</h2>
                  <p class="muted">Type a value and suggestions are generated from the current input.</p>
                </div>
              </div>
              <div class="field-row">
                <mat-form-field appearance="outline" class="wide">
                  <mat-label>Search</mat-label>
                  <input
                    matInput
                    [matAutocomplete]="basicAuto"
                    [value]="basicQuery()"
                    placeholder="Input here"
                    (input)="basicQuery.set($any($event.target).value)"
                  />
                  <mat-icon matSuffix>search</mat-icon>
                  <mat-autocomplete
                    #basicAuto="matAutocomplete"
                    (optionSelected)="basicQuery.set($event.option.value)"
                  >
                    @for (option of basicOptions(); track option) {
                      <mat-option [value]="option">{{ option }}</mat-option>
                    }
                  </mat-autocomplete>
                  <mat-hint>Try “vue”, “react” or “angular”.</mat-hint>
                </mat-form-field>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Controlled &amp; Custom Option</h2>
                  <p class="muted">A controlled value plus options rendered with icons.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Fruit</mat-label>
                  <input
                    matInput
                    [matAutocomplete]="fruitAuto"
                    [value]="fruitQuery()"
                    (input)="fruitQuery.set($any($event.target).value)"
                  />
                  <mat-autocomplete
                    #fruitAuto="matAutocomplete"
                    (optionSelected)="fruitQuery.set($event.option.value)"
                  >
                    @for (fruit of fruitOptions(); track fruit) {
                      <mat-option [value]="fruit">{{ fruit }}</mat-option>
                    }
                  </mat-autocomplete>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Tech stack</mat-label>
                  <input
                    matInput
                    [matAutocomplete]="techAuto"
                    [value]="techQuery()"
                    (input)="techQuery.set($any($event.target).value)"
                  />
                  <mat-autocomplete
                    #techAuto="matAutocomplete"
                    (optionSelected)="techQuery.set($event.option.value)"
                  >
                    @for (tech of techOptions; track tech.value) {
                      <mat-option [value]="tech.label">
                        <span class="option-line">
                          <mat-icon>{{ tech.icon }}</mat-icon>
                          {{ tech.label }}
                        </span>
                      </mat-option>
                    }
                  </mat-autocomplete>
                </mat-form-field>
              </div>
              <p class="inline-value">
                Current value: <strong>{{ fruitQuery() || '—' }}</strong>
              </p>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Async Search</h2>
                  <p class="muted">A debounced request is simulated with a short loading state.</p>
                </div>
                <button mat-stroked-button type="button" (click)="runEmailSearch()">Search</button>
              </div>
              <mat-form-field appearance="outline" class="wide">
                <mat-label>Email</mat-label>
                <input
                  matInput
                  [matAutocomplete]="emailAuto"
                  [value]="emailQuery()"
                  placeholder="Input an email prefix"
                  (input)="onEmailInput($event)"
                />
                @if (emailLoading()) {
                  <mat-progress-spinner matSuffix diameter="18" mode="indeterminate" />
                } @else {
                  <mat-icon matSuffix>alternate_email</mat-icon>
                }
                <mat-autocomplete
                  #emailAuto="matAutocomplete"
                  (optionSelected)="emailQuery.set($event.option.value)"
                >
                  @for (email of emailOptions(); track email) {
                    <mat-option [value]="email">{{ email }}</mat-option>
                  }
                </mat-autocomplete>
                <mat-hint>
                  @if (emailLoading()) {
                    Searching…
                  } @else {
                    Suggestions appear after the simulated request completes.
                  }
                </mat-hint>
              </mat-form-field>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Size &amp; Status</h2>
                  <p class="muted">Normal, warning and disabled presentation.</p>
                </div>
              </div>
              <div class="three-col">
                <mat-form-field appearance="outline">
                  <mat-label>Normal</mat-label>
                  <input matInput placeholder="Small" />
                  <mat-hint>Default status</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Warning</mat-label>
                  <input matInput placeholder="Warning" />
                  <mat-hint class="warn-text">Needs attention</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Disabled</mat-label>
                  <input matInput placeholder="Disabled" disabled />
                  <mat-hint class="error-text">Unavailable</mat-hint>
                </mat-form-field>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Cascader">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Single Select</h2>
                  <p class="muted">Nested selects narrow the category one level at a time.</p>
                </div>
              </div>
              <div class="three-col">
                <mat-form-field appearance="outline">
                  <mat-label>Category</mat-label>
                  <mat-select [value]="cascadeRoot()" (selectionChange)="setCascadeRoot($event.value)">
                    @for (node of cascadeOptions; track node.value) {
                      <mat-option [value]="node.value">{{ node.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Group</mat-label>
                  <mat-select [value]="cascadeChild()" (selectionChange)="setCascadeChild($event.value)">
                    @for (node of cascadeChildren(); track node.value) {
                      <mat-option [value]="node.value">{{ node.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Item</mat-label>
                  <mat-select [value]="cascadeLeaf()" (selectionChange)="cascadeLeaf.set($event.value)">
                    @for (node of cascadeLeaves(); track node.value) {
                      <mat-option [value]="node.value">{{ node.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
              <p class="inline-value">Selected path: <strong>{{ cascadePath() }}</strong></p>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Multiple Select</h2>
                  <p class="muted">Several leaf nodes can be selected across groups.</p>
                </div>
              </div>
              <mat-form-field appearance="outline" class="wide">
                <mat-label>Categories</mat-label>
                <mat-select
                  multiple
                  [value]="cascadeMulti()"
                  (selectionChange)="cascadeMulti.set($event.value)"
                >
                  @for (root of cascadeOptions; track root.value) {
                    <mat-optgroup [label]="root.label">
                      @for (group of root.children ?? []; track group.value) {
                        @for (leaf of group.children ?? []; track leaf.value) {
                          <mat-option [value]="leaf.value">{{ group.label }} / {{ leaf.label }}</mat-option>
                        }
                      }
                    </mat-optgroup>
                  }
                </mat-select>
              </mat-form-field>
              <mat-chip-set aria-label="Selected categories">
                @for (leaf of cascadeMulti(); track leaf) {
                  <mat-chip>{{ leaf }}</mat-chip>
                }
              </mat-chip-set>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Browse Tree</h2>
                  <p class="muted">A compact tree list of every available path.</p>
                </div>
              </div>
              <div class="tree">
                @for (root of cascadeOptions; track root.value) {
                  <div class="tree-group">
                    <div class="tree-group-title">
                      <mat-icon>folder_open</mat-icon>
                      <span>{{ root.label }}</span>
                    </div>
                    @for (group of root.children ?? []; track group.value) {
                      <div class="tree-branch">
                        <span class="tree-branch-title">{{ group.label }}</span>
                        <div class="tree-leaves">
                          @for (leaf of group.children ?? []; track leaf.value) {
                            <span class="tree-leaf" [class.selected]="cascadeLeaf() === leaf.value">
                              {{ leaf.label }}
                            </span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Checkbox">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Select Your Stack</h2>
                  <p class="muted">Multiple checkboxes with a live summary.</p>
                </div>
              </div>
              <div class="check-list">
                @for (item of stackItems; track item.id) {
                  <mat-checkbox
                    [checked]="selectedStack().has(item.id)"
                    (change)="toggleStack(item.id)"
                  >
                    {{ item.label }}
                  </mat-checkbox>
                }
              </div>
              <mat-chip-set aria-label="Selected technologies">
                @for (item of selectedStackList(); track item.id) {
                  <mat-chip>{{ item.label }}</mat-chip>
                }
              </mat-chip-set>
              @if (selectedStack().size === 0) {
                <p class="muted empty-line">No selection yet.</p>
              }
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Select All &amp; Indeterminate</h2>
                  <p class="muted">A parent checkbox mirrors the state of its children.</p>
                </div>
              </div>
              <mat-checkbox
                [checked]="allNotifications()"
                [indeterminate]="someNotifications()"
                (change)="toggleAllNotifications($event.checked)"
              >
                All notifications
              </mat-checkbox>
              <div class="check-list nested">
                @for (item of notificationItems; track item.id) {
                  <mat-checkbox
                    [checked]="selectedNotifications().has(item.id)"
                    (change)="toggleNotification(item.id)"
                  >
                    {{ item.label }}
                  </mat-checkbox>
                }
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>States</h2>
                  <p class="muted">Checked, unchecked and disabled states.</p>
                </div>
              </div>
              <div class="check-list">
                <mat-checkbox [checked]="true">Checked</mat-checkbox>
                <mat-checkbox>Unchecked</mat-checkbox>
                <mat-checkbox [checked]="true" [disabled]="true">Checked &amp; disabled</mat-checkbox>
                <mat-checkbox [disabled]="true">Disabled</mat-checkbox>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="ColorPicker">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Background Setting</h2>
                  <p class="muted">Pick a color and see it applied immediately.</p>
                </div>
              </div>
              <div class="color-row">
                <input
                  type="color"
                  class="native-color"
                  [value]="color()"
                  (input)="color.set($any($event.target).value)"
                  aria-label="Pick a color"
                />
                <mat-form-field appearance="outline">
                  <mat-label>Hex value</mat-label>
                  <input
                    matInput
                    [value]="color()"
                    (input)="color.set($any($event.target).value)"
                  />
                </mat-form-field>
                <span class="swatch" [style.background]="color()"></span>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Preset Palette</h2>
                  <p class="muted">A quick selection of common colors.</p>
                </div>
              </div>
              <div class="palette">
                @for (preset of colorPresets; track preset) {
                  <button
                    type="button"
                    class="palette-swatch"
                    [style.background]="preset"
                    [class.active]="color().toLowerCase() === preset.toLowerCase()"
                    [attr.aria-label]="preset"
                    (click)="color.set(preset)"
                  ></button>
                }
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Preview</h2>
                  <p class="muted">The current value with a contrast-safe label.</p>
                </div>
              </div>
              <div class="color-preview" [style.background]="color()">
                <span>{{ color() }}</span>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="DatePicker">
          <div class="tab-body" [formGroup]="dateForm">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Birthday</h2>
                  <p class="muted">A single date with a Material calendar.</p>
                </div>
              </div>
              <div class="field-row">
                <mat-form-field appearance="outline">
                  <mat-label>Birthday</mat-label>
                  <input matInput [matDatepicker]="birthdayPicker" formControlName="birthday" />
                  <mat-datepicker-toggle matIconSuffix [for]="birthdayPicker" />
                  <mat-datepicker #birthdayPicker />
                </mat-form-field>
                <p class="inline-value">
                  Value: <strong>{{ formatDate(dateForm.controls.birthday.value) }}</strong>
                </p>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Project Duration</h2>
                  <p class="muted">Start and end date with a range check.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Start date</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="start" />
                  <mat-datepicker-toggle matIconSuffix [for]="startPicker" />
                  <mat-datepicker #startPicker />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>End date</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="end" />
                  <mat-datepicker-toggle matIconSuffix [for]="endPicker" />
                  <mat-datepicker #endPicker />
                </mat-form-field>
              </div>
              @if (dateForm.hasError('dateRange')) {
                <p class="error-text">End date must be after the start date.</p>
              } @else {
                <p class="inline-value">Duration: <strong>{{ durationLabel() }}</strong></p>
              }
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Event Time</h2>
                  <p class="muted">A native time input combined with a disabled date.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Event time</mat-label>
                  <input
                    matInput
                    type="time"
                    [value]="eventTime()"
                    (input)="eventTime.set($any($event.target).value)"
                  />
                  <mat-icon matSuffix>schedule</mat-icon>
                  <mat-hint>Combined with the selected date.</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Locked date</mat-label>
                  <input matInput [matDatepicker]="lockedPicker" [value]="lockedDate" disabled />
                  <mat-datepicker-toggle matIconSuffix [for]="lockedPicker" [disabled]="true" />
                  <mat-datepicker #lockedPicker />
                  <mat-hint>Read-only field</mat-hint>
                </mat-form-field>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Form">
          <div class="tab-body">
            <div class="split">
              <section class="panel">
                <div class="section-head">
                  <div>
                    <h2>Create Account</h2>
                    <p class="muted">Reactive validation with a password confirmation check.</p>
                  </div>
                </div>
                <form [formGroup]="profileForm" (ngSubmit)="submitProfile()" class="form-stack">
                  <div class="two-col">
                    <mat-form-field appearance="outline">
                      <mat-label>Username</mat-label>
                      <input matInput formControlName="username" placeholder="Nickname" />
                      <mat-icon matPrefix>person</mat-icon>
                      @if (
                        profileForm.controls.username.touched &&
                        profileForm.controls.username.invalid
                      ) {
                        <mat-error>Use between 2 and 20 characters</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Email</mat-label>
                      <input matInput type="email" formControlName="email" />
                      <mat-icon matPrefix>mail</mat-icon>
                      @if (profileForm.controls.email.touched && profileForm.controls.email.invalid) {
                        <mat-error>Enter a valid email address</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Password</mat-label>
                      <input matInput type="password" formControlName="password" />
                      <mat-icon matPrefix>lock</mat-icon>
                      @if (
                        profileForm.controls.password.touched &&
                        profileForm.controls.password.invalid
                      ) {
                        <mat-error>At least 8 characters</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Confirm password</mat-label>
                      <input matInput type="password" formControlName="confirmPassword" />
                      <mat-icon matPrefix>lock_outline</mat-icon>
                      @if (profileForm.hasError('passwordMismatch')) {
                        <mat-error>Passwords do not match</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="actions">
                    <button mat-button type="button" (click)="profileForm.reset()">Reset</button>
                    <button mat-flat-button type="submit" [disabled]="saving()">
                      @if (saving()) {
                        <mat-progress-spinner diameter="16" mode="indeterminate" />
                        <span>Submitting…</span>
                      } @else {
                        <span>Submit registration</span>
                      }
                    </button>
                  </div>
                </form>
              </section>

              <aside class="panel">
                <div class="section-head">
                  <div>
                    <h2>Live Value</h2>
                    <p class="muted">Reactive form state and validity.</p>
                  </div>
                </div>
                <pre class="json">{{ profileJson() }}</pre>
                <p class="inline-value">
                  Status:
                  <strong>{{ profileForm.valid ? 'Valid' : 'Incomplete' }}</strong>
                </p>
              </aside>
            </div>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Account Preferences</h2>
                  <p class="muted">Role, plan, terms and newsletter in one block.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Role</mat-label>
                  <mat-select [value]="preferredRole()" (selectionChange)="preferredRole.set($event.value)">
                    <mat-option value="admin">Administrator</mat-option>
                    <mat-option value="editor">Editor</mat-option>
                    <mat-option value="viewer">Viewer</mat-option>
                  </mat-select>
                </mat-form-field>
                <div class="stack-controls">
                  <mat-checkbox [checked]="acceptTerms()" (change)="acceptTerms.set($event.checked)">
                    I accept the terms
                  </mat-checkbox>
                  <mat-slide-toggle
                    [checked]="newsletter()"
                    (change)="newsletter.set($event.checked)"
                  >
                    Weekly newsletter
                  </mat-slide-toggle>
                </div>
              </div>
              <div class="preference-row">
                <span class="field-label">Plan</span>
                <mat-radio-group [value]="plan()" (change)="plan.set($event.value)" class="radio-row">
                  <mat-radio-button value="starter">Starter</mat-radio-button>
                  <mat-radio-button value="pro">Pro</mat-radio-button>
                  <mat-radio-button value="enterprise">Enterprise</mat-radio-button>
                </mat-radio-group>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Input">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Form Validation</h2>
                  <p class="muted">Username, email, password and phone with inline errors.</p>
                </div>
              </div>
              <form [formGroup]="inputForm" (ngSubmit)="submitInput()" class="form-stack">
                <div class="two-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Username</mat-label>
                    <input matInput formControlName="username" placeholder="2–20 characters" />
                    <mat-icon matPrefix>person</mat-icon>
                    @if (
                      inputForm.controls.username.touched && inputForm.controls.username.invalid
                    ) {
                      <mat-error>Use between 2 and 20 characters</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email" />
                    <mat-icon matPrefix>mail</mat-icon>
                    @if (inputForm.controls.email.touched && inputForm.controls.email.invalid) {
                      <mat-error>Enter a valid email address</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Password</mat-label>
                    <input
                      matInput
                      [type]="showPassword() ? 'text' : 'password'"
                      formControlName="password"
                    />
                    <mat-icon matPrefix>lock</mat-icon>
                    <button
                      mat-icon-button
                      matSuffix
                      type="button"
                      [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                      (click)="showPassword.set(!showPassword())"
                    >
                      <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    @if (
                      inputForm.controls.password.touched && inputForm.controls.password.invalid
                    ) {
                      <mat-error>At least 8 characters</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Phone</mat-label>
                    <input matInput formControlName="phone" placeholder="+86 138 0000 0000" />
                    <mat-icon matPrefix>phone</mat-icon>
                    @if (inputForm.controls.phone.touched && inputForm.controls.phone.invalid) {
                      <mat-error>Enter a valid phone number</mat-error>
                    }
                  </mat-form-field>
                </div>
                <div class="actions">
                  <button mat-flat-button type="submit" [disabled]="inputSaving()">
                    {{ inputSaving() ? 'Submitting…' : 'Submit form' }}
                  </button>
                </div>
              </form>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Prefixes &amp; Suffixes</h2>
                  <p class="muted">Icons, currency prefixes and a counter.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Monthly budget</mat-label>
                  <span matTextPrefix>$&nbsp;</span>
                  <input matInput type="number" value="1200" />
                  <span matTextSuffix>.00</span>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Website</mat-label>
                  <span matTextPrefix>https://</span>
                  <input matInput value="example.com" />
                  <mat-icon matSuffix>public</mat-icon>
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" class="wide">
                <mat-label>Bio</mat-label>
                <textarea matInput rows="3" maxlength="240" placeholder="Tell us about yourself"></textarea>
                <mat-hint align="end">240 character limit</mat-hint>
              </mat-form-field>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>States</h2>
                  <p class="muted">Disabled, read-only and numeric inputs.</p>
                </div>
              </div>
              <div class="three-col">
                <mat-form-field appearance="outline">
                  <mat-label>Disabled</mat-label>
                  <input matInput value="Locked value" disabled />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Read only</mat-label>
                  <input matInput value="Read only value" readonly />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Visits</mat-label>
                  <input matInput type="number" value="128" />
                  <mat-icon matSuffix>trending_up</mat-icon>
                </mat-form-field>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="InputNumber">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Basic Usage</h2>
                  <p class="muted">Number fields with min, max and step.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Default</mat-label>
                  <input
                    matInput
                    type="number"
                    [value]="basicNumber()"
                    (input)="setNumber('basic', $event)"
                  />
                  <mat-hint>Current value: {{ basicNumber() }}</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>With step</mat-label>
                  <input
                    matInput
                    type="number"
                    step="5"
                    [value]="stepNumber()"
                    (input)="setNumber('step', $event)"
                  />
                  <mat-hint>Step size is 5</mat-hint>
                </mat-form-field>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Full Controls</h2>
                  <p class="muted">Increment and decrement from both sides of the field.</p>
                </div>
              </div>
              <div class="quantity-row">
                <button mat-stroked-button type="button" (click)="incrementQuantity(-1)">
                  <mat-icon>remove</mat-icon>
                </button>
                <mat-form-field appearance="outline">
                  <mat-label>Quantity</mat-label>
                  <input
                    matInput
                    type="number"
                    min="1"
                    max="999"
                    [value]="quantity()"
                    (input)="setNumber('quantity', $event)"
                  />
                  <mat-hint>Between 1 and 999</mat-hint>
                </mat-form-field>
                <button mat-stroked-button type="button" (click)="incrementQuantity(1)">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Decimal Precision</h2>
                  <p class="muted">Whole numbers and two-decimal prices.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Integer</mat-label>
                  <input matInput type="number" step="1" value="42" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Price</mat-label>
                  <span matTextPrefix>$&nbsp;</span>
                  <input
                    matInput
                    type="number"
                    step="0.01"
                    [value]="price()"
                    (input)="setNumber('price', $event)"
                  />
                </mat-form-field>
              </div>
              <div class="budget-card">
                <div class="budget-row">
                  <span>Discount</span>
                  <mat-form-field appearance="outline" class="narrow-field">
                    <mat-label>%</mat-label>
                    <input
                      matInput
                      type="number"
                      min="0"
                      max="100"
                      [value]="discount()"
                      (input)="setNumber('discount', $event)"
                    />
                  </mat-form-field>
                </div>
                <p class="budget-total">
                  Estimated total: <strong>{{ budget() }}</strong>
                </p>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Mentions">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Basic Usage</h2>
                  <p class="muted">Type an at-sign to open the user suggestions.</p>
                </div>
              </div>
              <mat-form-field appearance="outline" class="wide">
                <mat-label>Comment</mat-label>
                <textarea
                  matInput
                  rows="4"
                  [value]="mentionText()"
                  placeholder="Write a comment, then type the at-sign to mention someone"
                  (input)="onMentionInput($event)"
                ></textarea>
                <mat-hint>Type the at-sign followed by a name to filter users.</mat-hint>
              </mat-form-field>

              @if (mentionSuggestions().length > 0) {
                <div class="mention-suggestions">
                  @for (user of mentionSuggestions(); track user.name) {
                    <button type="button" class="mention-option" (click)="insertMention(user)">
                      <span class="avatar" [style.background]="user.color">
                        {{ user.name.charAt(0) }}
                      </span>
                      <span class="mention-copy">
                        <strong>{{ user.name }}</strong>
                        <span class="muted">{{ user.role }}</span>
                      </span>
                      <mat-icon>north_west</mat-icon>
                    </button>
                  }
                </div>
              }

              <p class="inline-value">Current content: <strong>{{ mentionText() || '—' }}</strong></p>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Mentioned Users</h2>
                  <p class="muted">The list keeps every mentioned person once.</p>
                </div>
              </div>
              @if (mentioned().length > 0) {
                <mat-chip-set aria-label="Mentioned users">
                  @for (name of mentioned(); track name) {
                    <mat-chip [removable]="true" (removed)="removeMention(name)">
                      {{ name }}
                      <mat-icon matChipRemove>cancel</mat-icon>
                    </mat-chip>
                  }
                </mat-chip-set>
              } @else {
                <p class="muted empty-line">No users mentioned yet.</p>
              }
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Disabled &amp; Sizes</h2>
                  <p class="muted">The same editor in a disabled, read-only state.</p>
                </div>
              </div>
              <mat-form-field appearance="outline" class="wide">
                <mat-label>Disabled editor</mat-label>
                <textarea matInput rows="3" disabled value="This editor is disabled."></textarea>
                <mat-hint>Interaction is unavailable.</mat-hint>
              </mat-form-field>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Small</mat-label>
                  <input matInput placeholder="Small input" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Large</mat-label>
                  <input matInput placeholder="Large input" />
                </mat-form-field>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Radio">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Basic Usage</h2>
                  <p class="muted">One mutually exclusive choice.</p>
                </div>
              </div>
              <mat-radio-group
                [value]="radioOption()"
                (change)="radioOption.set($event.value)"
                class="radio-row"
              >
                <mat-radio-button value="option1">Option One</mat-radio-button>
                <mat-radio-button value="option2">Option Two</mat-radio-button>
                <mat-radio-button value="option3">Option Three</mat-radio-button>
              </mat-radio-group>
              <p class="inline-value">
                Current selection: <strong>{{ radioOption() }}</strong>
              </p>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Options with Description</h2>
                  <p class="muted">Radio cards for plan selection.</p>
                </div>
              </div>
              <mat-radio-group
                [value]="radioPlan()"
                (change)="radioPlan.set($event.value)"
                class="radio-cards"
              >
                <mat-radio-button value="basic" class="radio-card">
                  <span class="radio-card-copy">
                    <strong>Basic Plan</strong>
                    <span class="muted">Core features for individuals.</span>
                  </span>
                  <span class="radio-card-price">$99 / mo</span>
                </mat-radio-button>
                <mat-radio-button value="pro" class="radio-card">
                  <span class="radio-card-copy">
                    <strong>Pro Plan <span class="plan-badge">Recommended</span></strong>
                    <span class="muted">Advanced features for teams.</span>
                  </span>
                  <span class="radio-card-price">$299 / mo</span>
                </mat-radio-button>
                <mat-radio-button value="enterprise" class="radio-card">
                  <span class="radio-card-copy">
                    <strong>Enterprise Plan</strong>
                    <span class="muted">Custom limits and dedicated support.</span>
                  </span>
                  <span class="radio-card-price">Custom</span>
                </mat-radio-button>
              </mat-radio-group>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>States &amp; Notifications</h2>
                  <p class="muted">Disabled options and a vertical notification group.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-radio-group [value]="disabledRadio()" class="radio-column">
                  <mat-radio-button value="enabled">Enabled</mat-radio-button>
                  <mat-radio-button value="disabled" disabled>Disabled</mat-radio-button>
                </mat-radio-group>

                <mat-radio-group
                  [value]="notificationPreference()"
                  (change)="notificationPreference.set($event.value)"
                  class="radio-column"
                >
                  <mat-radio-button value="all">Receive all notifications</mat-radio-button>
                  <mat-radio-button value="important">Important notifications only</mat-radio-button>
                  <mat-radio-button value="none">No notifications</mat-radio-button>
                </mat-radio-group>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Rate">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Basic Rating</h2>
                  <p class="muted">Click a star to set the score.</p>
                </div>
              </div>
              <div class="star-row">
                @for (star of fiveStars; track star) {
                  <button
                    type="button"
                    class="star"
                    [class.on]="rating() >= star"
                    [attr.aria-label]="'Rate ' + star"
                    (click)="rating.set(star)"
                  >
                    <mat-icon>{{ rating() >= star ? 'star' : 'star_border' }}</mat-icon>
                  </button>
                }
                <span class="rating-value">{{ rating() }} / 5</span>
              </div>
              <p class="muted">Click the same star again to keep the current score.</p>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Counts &amp; Icons</h2>
                  <p class="muted">Ten stars and a custom heart rating.</p>
                </div>
              </div>
              <div class="rating-block">
                <span class="field-label">10 star rating</span>
                <div class="star-row compact">
                  @for (star of tenStars; track star) {
                    <button
                      type="button"
                      class="star small"
                      [class.on]="tenRating() >= star"
                      [attr.aria-label]="'Rate ' + star"
                      (click)="tenRating.set(star)"
                    >
                      <mat-icon>{{ tenRating() >= star ? 'star' : 'star_border' }}</mat-icon>
                    </button>
                  }
                  <span class="rating-value">{{ tenRating() }} / 10</span>
                </div>
              </div>
              <div class="rating-block">
                <span class="field-label">Heart rating</span>
                <div class="star-row heart">
                  @for (star of fiveStars; track star) {
                    <button
                      type="button"
                      class="star"
                      [class.on]="heartRating() >= star"
                      [attr.aria-label]="'Rate ' + star"
                      (click)="heartRating.set(star)"
                    >
                      <mat-icon>{{ heartRating() >= star ? 'favorite' : 'favorite_border' }}</mat-icon>
                    </button>
                  }
                  <span class="rating-value">{{ heartRating() }} / 5</span>
                </div>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Read Only</h2>
                  <p class="muted">A disabled rating used to display an average.</p>
                </div>
              </div>
              <div class="star-row disabled">
                @for (star of fiveStars; track star) {
                  <mat-icon [class.on]="4 >= star">{{ 4 >= star ? 'star' : 'star_border' }}</mat-icon>
                }
                <span class="rating-value">4.0 average from 128 reviews</span>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Select">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Basic Usage</h2>
                  <p class="muted">Country and language selection.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Country</mat-label>
                  <mat-select [value]="country()" (selectionChange)="country.set($event.value)">
                    @for (item of countries; track item.value) {
                      <mat-option [value]="item.value">{{ item.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Language</mat-label>
                  <mat-select [value]="language()" (selectionChange)="language.set($event.value)">
                    @for (item of languages; track item.value) {
                      <mat-option [value]="item.value">{{ item.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
              <p class="inline-value">
                Selected: <strong>{{ selectedCountryLabel() }}</strong>
              </p>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Grouped Options</h2>
                  <p class="muted">Option groups plus a disabled department.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Data type</mat-label>
                  <mat-select [value]="dataType()" (selectionChange)="dataType.set($event.value)">
                    @for (group of selectGroups; track group.group) {
                      <mat-optgroup [label]="group.group">
                        @for (item of group.items; track item.value) {
                          <mat-option [value]="item.value">{{ item.label }}</mat-option>
                        }
                      </mat-optgroup>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Department</mat-label>
                  <mat-select [value]="department()" (selectionChange)="department.set($event.value)">
                    @for (item of departments; track item.value) {
                      <mat-option [value]="item.value" [disabled]="item.value === 'backend'">
                        <span class="option-line">
                          <mat-icon>{{ item.icon }}</mat-icon>
                          {{ item.label }}
                        </span>
                      </mat-option>
                    }
                  </mat-select>
                  <mat-hint>Backend is disabled.</mat-hint>
                </mat-form-field>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Multiple &amp; Disabled</h2>
                  <p class="muted">A multi-select with chips and a locked select.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Cities</mat-label>
                  <mat-select
                    multiple
                    [value]="cities()"
                    (selectionChange)="cities.set($event.value)"
                  >
                    @for (city of cityOptions; track city.value) {
                      <mat-option [value]="city.value">{{ city.label }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>{{ cities().length }} selected</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Locked</mat-label>
                  <mat-select [value]="'cn'" disabled>
                    <mat-option value="cn">China</mat-option>
                    <mat-option value="us">United States</mat-option>
                  </mat-select>
                  <mat-hint>Disabled selector</mat-hint>
                </mat-form-field>
              </div>
              <mat-chip-set aria-label="Selected cities">
                @for (city of cities(); track city) {
                  <mat-chip>{{ city }}</mat-chip>
                }
              </mat-chip-set>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Slider">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Basic Controls</h2>
                  <p class="muted">Volume and brightness update a live preview.</p>
                </div>
              </div>
              <div class="two-col">
                <div class="slider-field">
                  <span class="field-label">Volume: {{ volume() }}%</span>
                  <mat-slider min="0" max="100" step="1" discrete>
                    <input
                      matSliderThumb
                      [value]="volume()"
                      (valueChange)="volume.set($event)"
                    />
                  </mat-slider>
                  <p class="muted">
                    {{ volume() > 70 ? 'Loud output' : 'Comfortable output' }}
                  </p>
                </div>

                <div class="slider-field">
                  <span class="field-label">Brightness: {{ brightness() }}%</span>
                  <mat-slider min="0" max="100" step="1" discrete>
                    <input
                      matSliderThumb
                      [value]="brightness()"
                      (valueChange)="brightness.set($event)"
                    />
                  </mat-slider>
                  <div class="preview-bar" [style.opacity]="brightness() / 100"></div>
                </div>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Range &amp; Environment</h2>
                  <p class="muted">A two-thumb budget range and a temperature slider.</p>
                </div>
              </div>
              <div class="slider-field">
                <div class="slider-label-row">
                  <span class="field-label">Budget range</span>
                  <span class="value-pill">{{ priceMin() }} – {{ priceMax() }}</span>
                </div>
                <mat-slider min="0" max="500" step="5" discrete>
                  <input
                    matSliderStartThumb
                    [value]="priceMin()"
                    (valueChange)="priceMin.set($event)"
                  />
                  <input
                    matSliderEndThumb
                    [value]="priceMax()"
                    (valueChange)="priceMax.set($event)"
                  />
                </mat-slider>
              </div>

              <div class="slider-field">
                <span class="field-label">Temperature: {{ temperature() }}°C</span>
                <mat-slider min="-10" max="50" step="1" discrete>
                  <input
                    matSliderThumb
                    [value]="temperature()"
                    (valueChange)="temperature.set($event)"
                  />
                </mat-slider>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Snapshot</h2>
                  <p class="muted">The current control state as JSON.</p>
                </div>
              </div>
              <pre class="json">{{ sliderJson() }}</pre>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Switch">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Basic Usage</h2>
                  <p class="muted">Toggle binary settings with a description.</p>
                </div>
              </div>
              <div class="toggle-list">
                <div class="toggle-row">
                  <div>
                    <strong>Newsletter</strong>
                    <p class="muted">Receive the weekly product digest.</p>
                  </div>
                  <mat-slide-toggle
                    [checked]="newsletter()"
                    (change)="newsletter.set($event.checked)"
                  />
                </div>
                <div class="toggle-row">
                  <div>
                    <strong>Desktop notifications</strong>
                    <p class="muted">Show notifications outside the app.</p>
                  </div>
                  <mat-slide-toggle
                    [checked]="notifications()"
                    (change)="notifications.set($event.checked)"
                  />
                </div>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Controlled Preview</h2>
                  <p class="muted">The switch drives a local theme preview only.</p>
                </div>
              </div>
              <div class="toggle-row">
                <div>
                  <strong>Dark preview</strong>
                  <p class="muted">Preview the dark surface treatment.</p>
                </div>
                <mat-slide-toggle
                  [checked]="darkPreview()"
                  (change)="darkPreview.set($event.checked)"
                />
              </div>
              <div class="mode-preview" [class.dark]="darkPreview()">
                <mat-icon>{{ darkPreview() ? 'dark_mode' : 'light_mode' }}</mat-icon>
                <span>{{ darkPreview() ? 'Dark surface' : 'Light surface' }}</span>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Form Integration</h2>
                  <p class="muted">Required terms validation with a save state.</p>
                </div>
              </div>
              <form [formGroup]="switchForm" (ngSubmit)="saveSwitch()" class="form-stack">
                <mat-slide-toggle formControlName="newsletter">Subscribe to email</mat-slide-toggle>
                <mat-slide-toggle formControlName="notifications">Desktop notifications</mat-slide-toggle>
                <div>
                  <mat-slide-toggle formControlName="terms">I accept the terms</mat-slide-toggle>
                  @if (switchForm.controls.terms.touched && switchForm.controls.terms.invalid) {
                    <p class="error-text">Please accept the terms.</p>
                  }
                </div>
                <div class="actions">
                  <button mat-flat-button type="submit" [disabled]="switchSaving()">
                    {{ switchSaving() ? 'Saving…' : 'Save settings' }}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="TimePicker">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Basic</h2>
                  <p class="muted">A lightweight native time input.</p>
                </div>
              </div>
              <mat-form-field appearance="outline">
                <mat-label>Meeting time</mat-label>
                <input
                  matInput
                  type="time"
                  [value]="meetingTime()"
                  (input)="meetingTime.set($any($event.target).value)"
                />
                <mat-icon matSuffix>schedule</mat-icon>
              </mat-form-field>
              <p class="inline-value">
                Current selection: <strong>{{ meetingTime() || 'None' }}</strong>
              </p>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Range</h2>
                  <p class="muted">Start and end times with a computed duration.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>Start time</mat-label>
                  <input
                    matInput
                    type="time"
                    [value]="startTime()"
                    (input)="startTime.set($any($event.target).value)"
                  />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>End time</mat-label>
                  <input
                    matInput
                    type="time"
                    [value]="endTime()"
                    (input)="endTime.set($any($event.target).value)"
                  />
                </mat-form-field>
              </div>
              <p class="inline-value">Duration: <strong>{{ timeRangeLabel() }}</strong></p>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Seconds &amp; Disabled</h2>
                  <p class="muted">Second-level steps and a locked field.</p>
                </div>
              </div>
              <div class="two-col">
                <mat-form-field appearance="outline">
                  <mat-label>With seconds</mat-label>
                  <input matInput type="time" step="1" value="12:30:45" />
                  <mat-hint>step="1" enables seconds</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Disabled</mat-label>
                  <input matInput type="time" value="12:00" disabled />
                  <mat-hint>Unavailable</mat-hint>
                </mat-form-field>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Transfer">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Basic Transfer</h2>
                  <p class="muted">Move items between the available and selected lists.</p>
                </div>
              </div>
              <div class="transfer-search">
                <mat-form-field appearance="outline">
                  <mat-label>Search available</mat-label>
                  <input
                    matInput
                    [value]="leftQuery()"
                    (input)="leftQuery.set($any($event.target).value)"
                  />
                  <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Search selected</mat-label>
                  <input
                    matInput
                    [value]="rightQuery()"
                    (input)="rightQuery.set($any($event.target).value)"
                  />
                  <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>
              </div>

              <div class="transfer-grid">
                <div class="transfer-list">
                  <div class="transfer-title">
                    <span>Available</span>
                    <span class="muted">{{ availableItems().length }}</span>
                  </div>
                  <div class="list-box">
                    @for (item of availableItems(); track item.key) {
                      <div class="list-row" [class.disabled]="item.disabled">
                        <mat-checkbox
                          [checked]="checkedLeft().has(item.key)"
                          [disabled]="item.disabled"
                          (change)="toggleLeft(item.key)"
                        />
                        <span class="list-copy">
                          <strong>{{ item.title }}</strong>
                          <span class="muted">{{ item.description }}</span>
                        </span>
                      </div>
                    } @empty {
                      <p class="muted empty-line">No items available.</p>
                    }
                  </div>
                </div>

                <div class="transfer-actions">
                  <button
                    mat-flat-button
                    type="button"
                    [disabled]="checkedLeft().size === 0"
                    (click)="moveToTarget()"
                  >
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                  <button
                    mat-stroked-button
                    type="button"
                    [disabled]="checkedRight().size === 0"
                    (click)="moveToSource()"
                  >
                    <mat-icon>arrow_back</mat-icon>
                  </button>
                  <button mat-stroked-button type="button" (click)="moveAllToTarget()">
                    All <mat-icon>keyboard_double_arrow_right</mat-icon>
                  </button>
                  <button mat-stroked-button type="button" (click)="moveAllToSource()">
                    <mat-icon>keyboard_double_arrow_left</mat-icon> All
                  </button>
                </div>

                <div class="transfer-list">
                  <div class="transfer-title">
                    <span>Selected</span>
                    <span class="muted">{{ targetItems().length }}</span>
                  </div>
                  <div class="list-box">
                    @for (item of targetItems(); track item.key) {
                      <div class="list-row">
                        <mat-checkbox
                          [checked]="checkedRight().has(item.key)"
                          (change)="toggleRight(item.key)"
                        />
                        <span class="list-copy">
                          <strong>{{ item.title }}</strong>
                          <span class="muted">{{ item.description }}</span>
                        </span>
                      </div>
                    } @empty {
                      <p class="muted empty-line">No items selected.</p>
                    }
                  </div>
                </div>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Selected Items</h2>
                  <p class="muted">The current selection as chips and JSON.</p>
                </div>
              </div>
              @if (targetSummary().length > 0) {
                <mat-chip-set aria-label="Transferred items">
                  @for (title of targetSummary(); track title) {
                    <mat-chip>{{ title }}</mat-chip>
                  }
                </mat-chip-set>
              } @else {
                <p class="muted empty-line">Move items to the right to select them.</p>
              }
              <pre class="json">{{ transferJson() }}</pre>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="TreeSelect">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Multiple Selection</h2>
                  <p class="muted">A grouped select mirrored by a small checkable tree.</p>
                </div>
              </div>
              <mat-form-field appearance="outline" class="wide">
                <mat-label>Countries</mat-label>
                <mat-select
                  multiple
                  [value]="treeSelectionArray()"
                  (selectionChange)="onTreeSelect($event.value)"
                >
                  @for (group of treeGroups; track group.value) {
                    <mat-optgroup [label]="group.title">
                      @for (country of group.children; track country.value) {
                        <mat-option [value]="country.value">{{ country.title }}</mat-option>
                      }
                    </mat-optgroup>
                  }
                </mat-select>
              </mat-form-field>

              <div class="tree">
                @for (group of treeGroups; track group.value) {
                  <div class="tree-group">
                    <button
                      type="button"
                      class="tree-group-title"
                      (click)="toggleGroup(group.value)"
                    >
                      <mat-icon>
                        {{ expandedGroups().has(group.value) ? 'expand_more' : 'chevron_right' }}
                      </mat-icon>
                      <span>{{ group.title }}</span>
                      <span class="muted">{{ group.children.length }}</span>
                    </button>
                    @if (expandedGroups().has(group.value)) {
                      @for (country of group.children; track country.value) {
                        <div class="tree-leaf-row">
                          <mat-checkbox
                            [checked]="treeSelection().has(country.value)"
                            (change)="toggleCountry(country.value)"
                          >
                            {{ country.title }}
                          </mat-checkbox>
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Single Region</h2>
                  <p class="muted">Pick a group and show the resolved path.</p>
                </div>
              </div>
              <mat-form-field appearance="outline">
                <mat-label>Region</mat-label>
                <mat-select [value]="region()" (selectionChange)="region.set($event.value)">
                  @for (group of treeGroups; track group.value) {
                    <mat-option [value]="group.value">{{ group.title }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <p class="inline-value">Selected path: <strong>{{ regionPath() }}</strong></p>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Async Load</h2>
                  <p class="muted">Simulate a remote tree request and an error state.</p>
                </div>
                <div class="actions-inline">
                  <button mat-stroked-button type="button" (click)="reloadTree(false)">Reload</button>
                  <button mat-button type="button" (click)="reloadTree(true)">Simulate error</button>
                </div>
              </div>
              @if (treeLoading()) {
                <div class="loading-row">
                  <mat-progress-spinner diameter="20" mode="indeterminate" />
                  <span class="muted">Loading remote tree…</span>
                </div>
              } @else if (treeError()) {
                <p class="error-text">Error: {{ treeError() }}</p>
              } @else {
                <div class="tree">
                  @for (group of treeGroups; track group.value) {
                    <div class="tree-group">
                      <div class="tree-group-title">
                        <mat-icon>public</mat-icon>
                        <span>{{ group.title }}</span>
                      </div>
                      <div class="tree-branch">
                        <div class="tree-leaves">
                          @for (country of group.children; track country.value) {
                            <span class="tree-leaf">{{ country.title }}</span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Upload">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Standard Upload</h2>
                  <p class="muted">Select or drop files and inspect the list.</p>
                </div>
              </div>
              <label class="dropzone">
                <mat-icon>cloud_upload</mat-icon>
                <span>Drag files here or click to browse</span>
                <input
                  type="file"
                  multiple
                  hidden
                  (change)="onUploadSelect($event)"
                />
              </label>
              <div class="file-list">
                @for (file of uploadFiles(); track $index) {
                  <div class="file-row">
                    <mat-icon>description</mat-icon>
                    <span class="file-name">{{ file.name }}</span>
                    <span class="muted">{{ formatSize(file.size) }}</span>
                  </div>
                } @empty {
                  <p class="muted empty-line">No files selected.</p>
                }
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Large File (Resumable)</h2>
                  <p class="muted">Chunk progress is simulated in 25% steps.</p>
                </div>
                <button mat-stroked-button type="button" (click)="simulateLargeUpload()">
                  Simulate progress
                </button>
              </div>
              <label class="dropzone compact">
                <mat-icon>hard_drive</mat-icon>
                <span>Select large files</span>
                <input type="file" multiple hidden (change)="onLargeSelect($event)" />
              </label>
              <div class="file-list">
                @for (file of largeFiles(); track $index) {
                  <div class="file-block">
                    <div class="file-row">
                      <mat-icon>storage</mat-icon>
                      <span class="file-name">{{ file.name }}</span>
                      <span class="muted">{{ formatSize(file.size) }}</span>
                    </div>
                    <mat-progress-bar mode="determinate" [value]="file.progress" />
                  </div>
                } @empty {
                  <p class="muted empty-line">No large files selected.</p>
                }
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Summary</h2>
                  <p class="muted">Counts and total size for both upload modes.</p>
                </div>
                <button mat-button type="button" (click)="clearUploads()">Clear all</button>
              </div>
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="label">Standard files</span>
                  <div class="value">{{ uploadFiles().length }}</div>
                  <div class="muted">{{ formatSize(uploadTotal()) }}</div>
                </div>
                <div class="stat-card">
                  <span class="label">Large files</span>
                  <div class="value">{{ largeFiles().length }}</div>
                  <div class="muted">{{ formatSize(largeTotal()) }}</div>
                </div>
                <div class="stat-card">
                  <span class="label">Average progress</span>
                  <div class="value">{{ averageProgress() }}%</div>
                  <div class="muted">Across large files</div>
                </div>
              </div>
            </section>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      /* The 18-tab header must stay on one line and scroll horizontally. */
      :host ::ng-deep .mat-mdc-tab-header {
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
      }
      :host ::ng-deep .mat-mdc-tab-header::-webkit-scrollbar {
        display: none;
      }
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-label-container,
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-list {
        overflow: visible;
      }
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-labels {
        flex-wrap: nowrap;
        width: max-content;
      }

      .tab-body {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 4px 0 8px;
      }
      .panel h2 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
      }
      .section-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .section-head p {
        margin: 3px 0 0;
        font-size: 0.78rem;
      }
      .form-stack {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      mat-form-field {
        width: 100%;
      }
      .panel > mat-form-field {
        max-width: 380px;
      }
      .panel > mat-form-field.wide {
        max-width: none;
      }
      .two-col {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0 14px;
      }
      .three-col {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0 14px;
      }
      .split {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(240px, 1fr);
        gap: 14px;
        align-items: start;
      }
      .field-row {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
      }
      .field-row .wide,
      .wide {
        width: 100%;
      }
      .field-row mat-form-field {
        min-width: 260px;
      }
      .actions,
      .actions-inline {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
      }
      .actions button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .inline-value {
        margin: 4px 0 0;
        font-size: 0.8rem;
        color: var(--app-muted-foreground);
      }
      .inline-value strong {
        color: var(--app-foreground);
      }
      .empty-line {
        margin: 8px 0 0;
        font-size: 0.8rem;
        font-style: italic;
      }
      .error-text {
        margin: 4px 0 0;
        color: var(--app-destructive);
        font-size: 0.76rem;
      }
      .warn-text {
        color: #d97706 !important;
      }
      .json {
        margin: 0;
        padding: 12px;
        border-radius: var(--app-radius);
        background: var(--mat-sys-surface-container-low, #f7f8fa);
        font-size: 0.72rem;
        white-space: pre-wrap;
        word-break: break-all;
      }
      .option-line {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .option-line mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .check-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 10px;
      }
      .check-list.nested {
        margin: 8px 0 0 24px;
      }
      .chip-set,
      mat-chip-set {
        margin-top: 8px;
      }
      .stack-controls {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 6px 0;
      }
      .radio-row {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }
      .radio-column {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .preference-row {
        display: flex;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
        padding: 6px 0;
      }
      .field-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--app-foreground);
      }
      .color-row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .color-row mat-form-field {
        flex: 1;
        min-width: 220px;
      }
      .native-color {
        width: 54px;
        height: 54px;
        padding: 0;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: transparent;
        cursor: pointer;
      }
      .swatch {
        display: inline-block;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 1px solid var(--app-border);
      }
      .palette {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .palette-swatch {
        width: 34px;
        height: 34px;
        border: 2px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
      }
      .palette-swatch.active {
        border-color: var(--app-foreground);
        outline: 2px solid var(--app-card);
      }
      .color-preview {
        display: grid;
        place-items: center;
        height: 120px;
        border-radius: var(--app-radius);
        border: 1px solid var(--app-border);
        color: #fff;
        font-weight: 700;
        font-size: 1.05rem;
        text-shadow: 0 1px 3px rgb(0 0 0 / 0.55);
        transition: background 0.25s ease;
      }
      .quantity-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .quantity-row mat-form-field {
        flex: 1;
      }
      .budget-card {
        margin-top: 6px;
        padding: 12px;
        border: 1px dashed var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-muted);
      }
      .budget-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .narrow-field {
        width: 110px;
      }
      .budget-total {
        margin: 8px 0 0;
        font-size: 0.85rem;
      }
      .mention-suggestions {
        max-width: 420px;
        margin: 4px 0 10px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        overflow: hidden;
      }
      .mention-option {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px 10px;
        border: 0;
        background: var(--app-card);
        color: var(--app-foreground);
        text-align: left;
        cursor: pointer;
      }
      .mention-option:hover {
        background: var(--app-muted);
      }
      .mention-option mat-icon {
        margin-left: auto;
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--app-muted-foreground);
      }
      .avatar {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .mention-copy {
        display: flex;
        flex-direction: column;
        font-size: 0.8rem;
      }
      .mention-copy .muted {
        font-size: 0.72rem;
      }
      .radio-cards {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .radio-card {
        display: block;
        padding: 10px 12px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
      }
      :host ::ng-deep .radio-card .mdc-form-field {
        width: 100%;
      }
      .radio-card-copy {
        display: inline-flex;
        flex-direction: column;
        margin-left: 6px;
        vertical-align: top;
      }
      .radio-card-copy .muted {
        font-size: 0.74rem;
      }
      .radio-card-price {
        float: right;
        font-weight: 600;
        font-size: 0.82rem;
      }
      .plan-badge {
        margin-left: 6px;
        padding: 1px 6px;
        border-radius: 999px;
        background: var(--app-primary);
        color: var(--app-primary-foreground);
        font-size: 0.62rem;
        font-weight: 600;
      }
      .star-row {
        display: flex;
        align-items: center;
        gap: 2px;
        flex-wrap: wrap;
      }
      .star-row.compact {
        gap: 0;
      }
      .star {
        display: grid;
        place-items: center;
        padding: 2px;
        border: 0;
        background: transparent;
        color: var(--app-muted-foreground);
        cursor: pointer;
      }
      .star mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .star.small mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .star.on {
        color: #f59e0b;
      }
      .star-row.heart .star.on {
        color: #ef4444;
      }
      .star-row.disabled {
        color: var(--app-muted-foreground);
        gap: 0;
      }
      .star-row.disabled mat-icon.on {
        color: #f59e0b;
      }
      .rating-value {
        margin-left: 12px;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .rating-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
      }
      .slider-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 14px;
      }
      .slider-field mat-slider {
        width: 100%;
      }
      .slider-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .value-pill {
        padding: 2px 8px;
        border-radius: 999px;
        background: var(--app-muted);
        font-size: 0.72rem;
        font-weight: 600;
      }
      .preview-bar {
        height: 10px;
        border-radius: 999px;
        background: var(--app-primary);
        transition: opacity 0.2s ease;
      }
      .toggle-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .toggle-row p {
        margin: 2px 0 0;
        font-size: 0.76rem;
      }
      .mode-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        height: 90px;
        margin-top: 12px;
        border-radius: var(--app-radius);
        border: 1px solid var(--app-border);
        background: #f4f4f5;
        color: #18181b;
        font-weight: 600;
        transition: background 0.2s ease;
      }
      .mode-preview.dark {
        background: #18181b;
        color: #fafafa;
        border-color: #3f3f46;
      }
      .transfer-search {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .transfer-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        gap: 12px;
        align-items: stretch;
      }
      .transfer-list {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .transfer-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 4px;
        font-size: 0.78rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--app-muted-foreground);
      }
      .list-box {
        flex: 1;
        min-height: 180px;
        max-height: 260px;
        overflow: auto;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--mat-sys-surface-container-low, #fafafa);
      }
      .list-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        border-bottom: 1px solid var(--app-border);
        cursor: pointer;
      }
      .list-row:last-child {
        border-bottom: 0;
      }
      .list-row.disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .list-copy {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .list-copy strong {
        font-size: 0.78rem;
      }
      .list-copy .muted {
        font-size: 0.68rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .transfer-actions {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 6px;
        min-width: 90px;
      }
      .transfer-actions button {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.72rem;
      }
      .tree {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
      }
      .tree-group {
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        padding: 8px 10px;
      }
      .tree-group-title {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--app-foreground);
        font-family: inherit;
        font-size: 0.8rem;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
      }
      .tree-group-title mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--app-muted-foreground);
      }
      .tree-group-title .muted {
        margin-left: auto;
        font-size: 0.7rem;
        font-weight: 400;
      }
      .tree-branch {
        margin: 6px 0 0 22px;
      }
      .tree-branch-title {
        font-size: 0.74rem;
        font-weight: 600;
        color: var(--app-muted-foreground);
      }
      .tree-leaves {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
      }
      .tree-leaf {
        padding: 2px 8px;
        border-radius: 999px;
        background: var(--app-muted);
        font-size: 0.7rem;
      }
      .tree-leaf.selected {
        background: var(--app-primary);
        color: var(--app-primary-foreground);
      }
      .tree-leaf-row {
        margin: 4px 0 0 22px;
      }
      .loading-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 0;
      }
      .dropzone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 22px;
        border: 2px dashed var(--app-border);
        border-radius: var(--app-radius);
        background: var(--mat-sys-surface-container-low, #fafafa);
        color: var(--app-muted-foreground);
        font-size: 0.8rem;
        text-align: center;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .dropzone:hover {
        background: var(--app-muted);
        border-color: var(--app-muted-foreground);
      }
      .dropzone.compact {
        padding: 14px;
      }
      .dropzone mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }
      .file-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 10px;
      }
      .file-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 2px;
        border-bottom: 1px solid var(--app-border);
        font-size: 0.78rem;
      }
      .file-row mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--app-muted-foreground);
      }
      .file-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .file-block {
        padding: 4px 0;
      }
      .file-block mat-progress-bar {
        margin-top: 3px;
      }
      @media (max-width: 900px) {
        .two-col,
        .three-col,
        .split,
        .transfer-search {
          grid-template-columns: 1fr;
        }
        .transfer-grid {
          grid-template-columns: 1fr;
        }
        .transfer-actions {
          flex-direction: row;
          flex-wrap: wrap;
        }
        .field-row mat-form-field {
          min-width: 100%;
        }
      }
    `,
  ],
})
export class ComponentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly cascadeOptions = CASCADE_OPTIONS;
  readonly treeGroups = TREE_GROUPS;
  readonly selectGroups = SELECT_GROUPS;

  readonly countries = [
    { value: 'cn', label: 'China' },
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'jp', label: 'Japan' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
  ];

  readonly languages = [
    { value: 'zh', label: 'Chinese' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: 'Japanese' },
    { value: 'de', label: 'German' },
    { value: 'fr', label: 'French' },
  ];

  readonly departments = [
    { value: 'frontend', label: 'Frontend', icon: 'public' },
    { value: 'backend', label: 'Backend', icon: 'dns' },
    { value: 'design', label: 'Design', icon: 'palette' },
    { value: 'product', label: 'Product', icon: 'inventory_2' },
    { value: 'hr', label: 'Human Resources', icon: 'groups' },
  ];

  readonly cityOptions = [
    { value: 'sh', label: 'Shanghai' },
    { value: 'hz', label: 'Hangzhou' },
    { value: 'nj', label: 'Nanjing' },
    { value: 'bj', label: 'Beijing' },
    { value: 'gz', label: 'Guangzhou' },
    { value: 'sz', label: 'Shenzhen' },
  ];

  readonly stackItems = [
    { id: 'react', label: 'React.js' },
    { id: 'vue', label: 'Vue.js' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'tailwind', label: 'Tailwind CSS' },
  ];

  readonly notificationItems = [
    { id: 'email', label: 'Email updates' },
    { id: 'push', label: 'Push notifications' },
    { id: 'sms', label: 'SMS alerts' },
  ];

  readonly fiveStars = [1, 2, 3, 4, 5];
  readonly tenStars = Array.from({ length: 10 }, (_, index) => index + 1);

  readonly colorPresets = [
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#ef4444',
    '#f59e0b',
    '#10b981',
    '#14b8a6',
  ];

  readonly techOptions = [
    { value: 'vue', label: 'Vue', icon: 'change_history' },
    { value: 'react', label: 'React', icon: 'hub' },
    { value: 'spring', label: 'Spring Boot', icon: 'eco' },
    { value: 'angular', label: 'Angular', icon: 'shield' },
  ];

  readonly fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Mango'];

  readonly lockedDate = new Date(2026, 0, 1);

  /* ------------------------------------------------------------------ */
  /* AutoComplete                                                        */
  /* ------------------------------------------------------------------ */
  readonly basicQuery = signal('');
  readonly fruitQuery = signal('Apple');
  readonly techQuery = signal('');
  readonly emailQuery = signal('');
  readonly emailOptions = signal<string[]>([]);
  readonly emailLoading = signal(false);

  readonly basicOptions = computed(() => {
    const value = this.basicQuery().trim();
    if (!value) return [];
    return [value, `${value}${value}`, `${value}${value}${value}`];
  });

  readonly fruitOptions = computed(() => {
    const query = this.fruitQuery().trim().toLowerCase();
    return this.fruits.filter((fruit) => fruit.toLowerCase().includes(query));
  });

  /* ------------------------------------------------------------------ */
  /* Cascader                                                            */
  /* ------------------------------------------------------------------ */
  readonly cascadeRoot = signal('clothes');
  readonly cascadeChild = signal('mens');
  readonly cascadeLeaf = signal('tshirt');
  readonly cascadeMulti = signal<string[]>(['apple', 'carrot']);

  readonly cascadeChildren = computed(
    () => this.cascadeOptions.find((node) => node.value === this.cascadeRoot())?.children ?? [],
  );

  readonly cascadeLeaves = computed(
    () => this.cascadeChildren().find((node) => node.value === this.cascadeChild())?.children ?? [],
  );

  readonly cascadePath = computed(() => {
    const root = this.cascadeOptions.find((node) => node.value === this.cascadeRoot());
    const child = this.cascadeChildren().find((node) => node.value === this.cascadeChild());
    const leaf = this.cascadeLeaves().find((node) => node.value === this.cascadeLeaf());
    return [root?.label, child?.label, leaf?.label].filter(Boolean).join(' / ') || 'None';
  });

  /* ------------------------------------------------------------------ */
  /* Checkbox                                                            */
  /* ------------------------------------------------------------------ */
  readonly selectedStack = signal<ReadonlySet<string>>(new Set<string>());
  readonly selectedNotifications = signal<ReadonlySet<string>>(new Set<string>(['email']));

  readonly selectedStackList = computed(() =>
    this.stackItems.filter((item) => this.selectedStack().has(item.id)),
  );

  readonly allNotifications = computed(
    () => this.selectedNotifications().size === this.notificationItems.length,
  );

  readonly someNotifications = computed(
    () => this.selectedNotifications().size > 0 && !this.allNotifications(),
  );

  /* ------------------------------------------------------------------ */
  /* ColorPicker                                                         */
  /* ------------------------------------------------------------------ */
  readonly color = signal('#3b82f6');

  /* ------------------------------------------------------------------ */
  /* DatePicker                                                          */
  /* ------------------------------------------------------------------ */
  readonly eventTime = signal('12:00');

  readonly dateForm = this.fb.group(
    {
      birthday: [new Date(1990, 4, 12) as Date | null],
      start: [new Date() as Date | null],
      end: [new Date(Date.now() + 7 * 86_400_000) as Date | null],
    },
    { validators: this.dateRangeValidator },
  );

  /* ------------------------------------------------------------------ */
  /* Form                                                                */
  /* ------------------------------------------------------------------ */
  readonly saving = signal(false);
  readonly plan = signal('pro');
  readonly preferredRole = signal('editor');
  readonly acceptTerms = signal(true);
  readonly newsletter = signal(true);

  readonly profileForm = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordsMatch },
  );

  /* ------------------------------------------------------------------ */
  /* Input                                                               */
  /* ------------------------------------------------------------------ */
  readonly showPassword = signal(false);
  readonly inputSaving = signal(false);

  readonly inputForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: ['', [Validators.required, Validators.pattern(/^[\d\s\-+()]+$/)]],
  });

  /* ------------------------------------------------------------------ */
  /* InputNumber                                                         */
  /* ------------------------------------------------------------------ */
  readonly basicNumber = signal(5);
  readonly stepNumber = signal(10);
  readonly quantity = signal(2);
  readonly price = signal(99.99);
  readonly discount = signal(10);

  readonly budget = computed(() =>
    (this.price() * this.quantity() * (1 - this.discount() / 100)).toFixed(2),
  );

  /* ------------------------------------------------------------------ */
  /* Mentions                                                            */
  /* ------------------------------------------------------------------ */
  readonly mentionText = signal('');
  readonly mentioned = signal<string[]>([]);

  readonly mentionSuggestions = computed(() => {
    const text = this.mentionText();
    const match = /(?:^|\s)@([^\s@]*)$/.exec(text);
    if (!match) return [];
    const query = match[1].toLowerCase();
    return MENTION_USERS.filter((user) => user.name.toLowerCase().includes(query));
  });

  /* ------------------------------------------------------------------ */
  /* Radio                                                               */
  /* ------------------------------------------------------------------ */
  readonly radioOption = signal('option1');
  readonly radioPlan = signal('basic');
  readonly disabledRadio = signal('enabled');
  readonly notificationPreference = signal('all');

  /* ------------------------------------------------------------------ */
  /* Rate                                                                */
  /* ------------------------------------------------------------------ */
  readonly rating = signal(3);
  readonly tenRating = signal(7);
  readonly heartRating = signal(4);

  /* ------------------------------------------------------------------ */
  /* Select                                                              */
  /* ------------------------------------------------------------------ */
  readonly country = signal('cn');
  readonly language = signal('en');
  readonly dataType = signal('text');
  readonly department = signal('frontend');
  readonly cities = signal<string[]>(['sh', 'bj']);

  readonly selectedCountryLabel = computed(
    () => this.countries.find((item) => item.value === this.country())?.label ?? 'None',
  );

  /* ------------------------------------------------------------------ */
  /* Slider                                                              */
  /* ------------------------------------------------------------------ */
  readonly volume = signal(50);
  readonly brightness = signal(70);
  readonly priceMin = signal(20);
  readonly priceMax = signal(80);
  readonly temperature = signal(20);

  /* ------------------------------------------------------------------ */
  /* Switch                                                              */
  /* ------------------------------------------------------------------ */
  readonly notifications = signal(false);
  readonly darkPreview = signal(false);
  readonly switchSaving = signal(false);

  readonly switchForm = this.fb.nonNullable.group({
    newsletter: [true],
    notifications: [false],
    terms: [false, Validators.requiredTrue],
  });

  /* ------------------------------------------------------------------ */
  /* TimePicker                                                          */
  /* ------------------------------------------------------------------ */
  readonly meetingTime = signal('');
  readonly startTime = signal('09:00');
  readonly endTime = signal('17:00');

  /* ------------------------------------------------------------------ */
  /* Transfer                                                            */
  /* ------------------------------------------------------------------ */
  readonly leftQuery = signal('');
  readonly rightQuery = signal('');
  readonly targetKeys = signal<ReadonlySet<string>>(new Set<string>(['2', '5']));
  readonly checkedLeft = signal<ReadonlySet<string>>(new Set<string>());
  readonly checkedRight = signal<ReadonlySet<string>>(new Set<string>());

  readonly availableItems = computed(() =>
    TRANSFER_SOURCE.filter(
      (item) => !this.targetKeys().has(item.key) && this.matchesQuery(item, this.leftQuery()),
    ),
  );

  readonly targetItems = computed(() =>
    TRANSFER_SOURCE.filter(
      (item) => this.targetKeys().has(item.key) && this.matchesQuery(item, this.rightQuery()),
    ),
  );

  readonly targetSummary = computed(() =>
    TRANSFER_SOURCE.filter((item) => this.targetKeys().has(item.key)).map((item) => item.title),
  );

  /* ------------------------------------------------------------------ */
  /* TreeSelect                                                          */
  /* ------------------------------------------------------------------ */
  readonly treeSelection = signal<ReadonlySet<string>>(new Set<string>(['cn', 'de']));
  readonly expandedGroups = signal<ReadonlySet<string>>(new Set<string>(['asia', 'europe']));
  readonly region = signal('asia');
  readonly treeLoading = signal(false);
  readonly treeError = signal<string | null>(null);

  readonly treeSelectionArray = computed(() => Array.from(this.treeSelection()));

  readonly regionPath = computed(() => {
    const group = this.treeGroups.find((item) => item.value === this.region());
    return group ? group.title : 'None';
  });

  /* ------------------------------------------------------------------ */
  /* Upload                                                              */
  /* ------------------------------------------------------------------ */
  readonly uploadFiles = signal<UploadFileItem[]>([]);
  readonly largeFiles = signal<UploadFileItem[]>([]);

  readonly uploadTotal = computed(() =>
    this.uploadFiles().reduce((sum, file) => sum + file.size, 0),
  );

  readonly largeTotal = computed(() =>
    this.largeFiles().reduce((sum, file) => sum + file.size, 0),
  );

  readonly averageProgress = computed(() => {
    const files = this.largeFiles();
    if (files.length === 0) return 0;
    return Math.round(files.reduce((sum, file) => sum + file.progress, 0) / files.length);
  });

  /* ------------------------------------------------------------------ */
  /* AutoComplete methods                                                */
  /* ------------------------------------------------------------------ */
  onEmailInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emailQuery.set(value);
    this.runEmailSearch();
  }

  runEmailSearch(): void {
    const query = this.emailQuery().trim();
    if (!query) {
      this.emailOptions.set([]);
      this.emailLoading.set(false);
      return;
    }
    this.emailLoading.set(true);
    setTimeout(() => {
      this.emailOptions.set([`${query}@gmail.com`, `${query}@outlook.com`, `${query}@qq.com`]);
      this.emailLoading.set(false);
    }, 600);
  }

  /* ------------------------------------------------------------------ */
  /* Cascader methods                                                    */
  /* ------------------------------------------------------------------ */
  setCascadeRoot(value: string): void {
    this.cascadeRoot.set(value);
    const firstChild = this.cascadeOptions.find((node) => node.value === value)?.children?.[0];
    this.cascadeChild.set(firstChild?.value ?? '');
    this.cascadeLeaf.set(firstChild?.children?.[0]?.value ?? '');
  }

  setCascadeChild(value: string): void {
    this.cascadeChild.set(value);
    const firstLeaf = this.cascadeChildren().find((node) => node.value === value)?.children?.[0];
    this.cascadeLeaf.set(firstLeaf?.value ?? '');
  }

  /* ------------------------------------------------------------------ */
  /* Checkbox methods                                                    */
  /* ------------------------------------------------------------------ */
  toggleStack(id: string): void {
    this.selectedStack.update((current) => this.toggleSet(current, id));
  }

  toggleNotification(id: string): void {
    this.selectedNotifications.update((current) => this.toggleSet(current, id));
  }

  toggleAllNotifications(checked: boolean): void {
    this.selectedNotifications.set(
      checked ? new Set(this.notificationItems.map((item) => item.id)) : new Set<string>(),
    );
  }

  /* ------------------------------------------------------------------ */
  /* DatePicker methods                                                  */
  /* ------------------------------------------------------------------ */
  formatDate(value: Date | null): string {
    if (!value) return 'Not selected';
    return value.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  durationLabel(): string {
    const start = this.dateForm.controls.start.value;
    const end = this.dateForm.controls.end.value;
    if (!start || !end) return 'Select a start and end date';
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    return days >= 0 ? `${days} day(s)` : 'End date must be after the start date';
  }

  /* ------------------------------------------------------------------ */
  /* Form methods                                                        */
  /* ------------------------------------------------------------------ */
  profileJson(): string {
    return JSON.stringify(this.profileForm.getRawValue(), null, 2);
  }

  submitProfile(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) {
      this.snackBar.open('Please fix the highlighted fields', 'OK', { duration: 2500 });
      return;
    }
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.snackBar.open('Account created', 'OK', { duration: 2500 });
      this.profileForm.reset();
    }, 900);
  }

  submitInput(): void {
    this.inputForm.markAllAsTouched();
    if (this.inputForm.invalid) {
      this.snackBar.open('Please fix the highlighted fields', 'OK', { duration: 2500 });
      return;
    }
    this.inputSaving.set(true);
    setTimeout(() => {
      this.inputSaving.set(false);
      this.snackBar.open('Form submitted', 'OK', { duration: 2500 });
      this.inputForm.reset();
    }, 900);
  }

  /* ------------------------------------------------------------------ */
  /* InputNumber methods                                                 */
  /* ------------------------------------------------------------------ */
  setNumber(target: 'basic' | 'step' | 'quantity' | 'price' | 'discount', event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    const value = Number.isFinite(raw) ? raw : 0;
    switch (target) {
      case 'basic':
        this.basicNumber.set(value);
        break;
      case 'step':
        this.stepNumber.set(value);
        break;
      case 'quantity':
        this.quantity.set(Math.max(1, value));
        break;
      case 'price':
        this.price.set(Math.max(0, value));
        break;
      case 'discount':
        this.discount.set(Math.min(100, Math.max(0, value)));
        break;
    }
  }

  incrementQuantity(delta: number): void {
    this.quantity.update((value) => Math.min(999, Math.max(1, value + delta)));
  }

  /* ------------------------------------------------------------------ */
  /* Mentions methods                                                    */
  /* ------------------------------------------------------------------ */
  onMentionInput(event: Event): void {
    this.mentionText.set((event.target as HTMLTextAreaElement).value);
  }

  insertMention(user: MentionUser): void {
    const text = this.mentionText();
    const next = /@([^\s@]*)$/.test(text)
      ? text.replace(/@([^\s@]*)$/, `@${user.name} `)
      : `${text}${text ? ' ' : ''}@${user.name} `;
    this.mentionText.set(next);
    this.mentioned.update((users) => (users.includes(user.name) ? users : [...users, user.name]));
  }

  removeMention(name: string): void {
    this.mentioned.update((users) => users.filter((user) => user !== name));
  }

  /* ------------------------------------------------------------------ */
  /* Slider methods                                                      */
  /* ------------------------------------------------------------------ */
  sliderJson(): string {
    return JSON.stringify(
      {
        volume: this.volume(),
        brightness: this.brightness(),
        priceRange: [this.priceMin(), this.priceMax()],
        temperature: this.temperature(),
      },
      null,
      2,
    );
  }

  /* ------------------------------------------------------------------ */
  /* Switch methods                                                      */
  /* ------------------------------------------------------------------ */
  saveSwitch(): void {
    this.switchForm.markAllAsTouched();
    if (this.switchForm.invalid) {
      this.snackBar.open('Please accept the terms', 'OK', { duration: 2500 });
      return;
    }
    this.switchSaving.set(true);
    setTimeout(() => {
      this.switchSaving.set(false);
      this.snackBar.open('Settings saved', 'OK', { duration: 2500 });
    }, 700);
  }

  /* ------------------------------------------------------------------ */
  /* TimePicker methods                                                  */
  /* ------------------------------------------------------------------ */
  timeRangeLabel(): string {
    const start = this.startTime();
    const end = this.endTime();
    if (!start || !end) return 'Select both times';
    const [startHour = 0, startMinute = 0] = start.split(':').map(Number);
    const [endHour = 0, endMinute = 0] = end.split(':').map(Number);
    const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
    if (minutes < 0) return 'End must be after start';
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  /* ------------------------------------------------------------------ */
  /* Transfer methods                                                    */
  /* ------------------------------------------------------------------ */
  toggleLeft(key: string): void {
    this.checkedLeft.update((current) => this.toggleSet(current, key));
  }

  toggleRight(key: string): void {
    this.checkedRight.update((current) => this.toggleSet(current, key));
  }

  moveToTarget(): void {
    const next = new Set(this.targetKeys());
    for (const key of this.checkedLeft()) next.add(key);
    this.targetKeys.set(next);
    this.checkedLeft.set(new Set<string>());
  }

  moveToSource(): void {
    const next = new Set(this.targetKeys());
    for (const key of this.checkedRight()) next.delete(key);
    this.targetKeys.set(next);
    this.checkedRight.set(new Set<string>());
  }

  moveAllToTarget(): void {
    const next = new Set(this.targetKeys());
    for (const item of TRANSFER_SOURCE) {
      if (!item.disabled) next.add(item.key);
    }
    this.targetKeys.set(next);
    this.checkedLeft.set(new Set<string>());
  }

  moveAllToSource(): void {
    this.targetKeys.set(new Set<string>());
    this.checkedRight.set(new Set<string>());
  }

  transferJson(): string {
    return JSON.stringify(Array.from(this.targetKeys()).sort(), null, 2);
  }

  /* ------------------------------------------------------------------ */
  /* TreeSelect methods                                                  */
  /* ------------------------------------------------------------------ */
  onTreeSelect(values: string[]): void {
    this.treeSelection.set(new Set(values));
  }

  toggleCountry(value: string): void {
    this.treeSelection.update((current) => this.toggleSet(current, value));
  }

  toggleGroup(value: string): void {
    this.expandedGroups.update((current) => this.toggleSet(current, value));
  }

  reloadTree(simulateError: boolean): void {
    this.treeLoading.set(true);
    this.treeError.set(null);
    setTimeout(() => {
      this.treeLoading.set(false);
      this.treeError.set(simulateError ? 'Failed to fetch remote tree data' : null);
    }, 800);
  }

  /* ------------------------------------------------------------------ */
  /* Upload methods                                                      */
  /* ------------------------------------------------------------------ */
  onUploadSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    const additions = Array.from(files).map((file) => ({
      name: file.name,
      size: file.size,
      progress: 100,
    }));
    this.uploadFiles.update((current) => [...current, ...additions]);
    input.value = '';
  }

  onLargeSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    const additions = Array.from(files).map((file) => ({
      name: file.name,
      size: file.size,
      progress: 0,
    }));
    this.largeFiles.update((current) => [...current, ...additions]);
    input.value = '';
  }

  simulateLargeUpload(): void {
    this.largeFiles.update((files) =>
      files.map((file) => ({ ...file, progress: Math.min(100, file.progress + 25) })),
    );
  }

  clearUploads(): void {
    this.uploadFiles.set([]);
    this.largeFiles.set([]);
  }

  formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  /* ------------------------------------------------------------------ */
  /* Shared helpers                                                      */
  /* ------------------------------------------------------------------ */
  private toggleSet(source: ReadonlySet<string>, value: string): ReadonlySet<string> {
    const next = new Set(source);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  private matchesQuery(item: TransferItem, query: string): boolean {
    const value = query.trim().toLowerCase();
    if (!value) return true;
    return (
      item.title.toLowerCase().includes(value) || item.description.toLowerCase().includes(value)
    );
  }

  private passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value as string;
    const confirmation = control.get('confirmPassword')?.value as string;
    return password && confirmation && password !== confirmation
      ? { passwordMismatch: true }
      : null;
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('start')?.value as Date | null;
    const end = control.get('end')?.value as Date | null;
    return start && end && end < start ? { dateRange: true } : null;
  }
}
