import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DateRange, MatCalendar } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../core/translate.pipe';
import { I18nService } from '../../core/i18n.service';

export interface DateTimeRangeValue {
  /** Local time formatted as yyyy-MM-ddTHH:mm; empty means no bound. */
  from: string;
  to: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function timePart(value: string, fallback: string): string {
  const match = /T(\d{2}:\d{2})/.exec(value);
  return match?.[1] ?? fallback;
}

function withTime(date: Date, time: string): string {
  return `${formatDay(date)}T${time}`;
}

/**
 * Paired start/end date-time control: one trigger, one panel with a Material
 * calendar range plus start/end time inputs. Emits local yyyy-MM-ddTHH:mm.
 */
@Component({
  selector: 'app-date-time-range-picker',
  standalone: true,
  imports: [MatCalendar, MatIconModule, TranslatePipe],
  template: `
    <button
      class="system-button range-trigger"
      type="button"
      aria-haspopup="dialog"
      [attr.aria-expanded]="open()"
      (click)="toggle()"
    >
      <mat-icon>calendar_today</mat-icon>
      <span class="range-label">{{ label() }}</span>
      @if (fromDate()) {
        <span
          class="range-clear"
          role="button"
          tabindex="0"
          [attr.aria-label]="'button.clear' | t"
          (click)="clearFromTrigger($event)"
          (keydown)="onClearKey($event)"
        >
          <mat-icon>close</mat-icon>
        </span>
      }
    </button>

    @if (open()) {
      <div class="range-panel" role="dialog">
        <mat-calendar
          [selected]="selectedRange()"
          [startAt]="startAt()"
          [startDateAccessibleName]="'page.system.operationLog.header.from' | t"
          [endDateAccessibleName]="'page.system.operationLog.header.to' | t"
          (selectedChange)="onSelect($event)"
        />
        <div class="range-times">
          <div class="range-time-field">
            <label class="range-time-label" for="range-time-from">
              {{ 'page.system.operationLog.header.from' | t }}
            </label>
            <input
              id="range-time-from"
              class="system-input range-time"
              type="time"
              [value]="fromTime()"
              [disabled]="!fromDate()"
              (input)="changeFromTime($event)"
            />
          </div>
          <div class="range-time-field">
            <label class="range-time-label" for="range-time-to">
              {{ 'page.system.operationLog.header.to' | t }}
            </label>
            <input
              id="range-time-to"
              class="system-input range-time"
              type="time"
              [value]="toTime()"
              [disabled]="!toDate()"
              (input)="changeToTime($event)"
            />
          </div>
          <div class="range-actions">
            <button class="system-button small" type="button" (click)="clear()">
              {{ 'button.clear' | t }}
            </button>
            <button class="system-button small" type="button" (click)="selectToday()">
              {{ 'page.system.operationLog.today' | t }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: relative;
        display: inline-flex;
      }
      .range-trigger {
        max-width: 22rem;
        justify-content: flex-start;
        font-weight: 400;
      }
      .range-trigger .mat-icon {
        color: var(--app-muted-foreground);
      }
      .range-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .range-clear {
        display: inline-flex;
        margin-left: 0.125rem;
        padding: 0.125rem;
        border-radius: 0.25rem;
        color: var(--app-muted-foreground);
        cursor: pointer;
      }
      .range-clear:hover {
        color: var(--app-foreground);
      }
      .range-clear .mat-icon {
        font-size: 0.875rem;
        width: 0.875rem;
        height: 0.875rem;
      }
      .range-panel {
        position: absolute;
        top: calc(100% + 0.25rem);
        left: 0;
        z-index: 30;
        width: 19rem;
        padding-bottom: 0.25rem;
        border: 1px solid var(--app-border);
        border-radius: 0.5rem;
        background: var(--app-card);
        box-shadow: var(--mat-sys-level3);
      }
      .range-panel ::ng-deep .mat-calendar {
        width: 100%;
      }
      .range-times {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 0.75rem;
        padding: 0.75rem;
        border-top: 1px solid var(--app-border);
      }
      .range-time-field {
        display: grid;
        gap: 0.375rem;
      }
      .range-time-label {
        color: var(--app-muted-foreground);
        font-size: 0.75rem;
      }
      .range-time {
        width: 7rem;
        height: 2rem;
      }
      .range-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: auto;
      }
    `,
  ],
})
export class DateTimeRangePickerComponent {
  readonly value = input<DateTimeRangeValue>({ from: '', to: '' });
  readonly valueChange = output<DateTimeRangeValue>();

  private readonly i18n = inject(I18nService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly pendingStart = signal<Date | null>(null);
  readonly open = signal(false);

  readonly fromDate = computed(() => parseValue(this.value().from));
  readonly toDate = computed(() => parseValue(this.value().to));
  readonly fromTime = computed(() => timePart(this.value().from, '00:00'));
  readonly toTime = computed(() => timePart(this.value().to, '23:59'));
  readonly startAt = computed(() => this.fromDate() ?? new Date());
  readonly selectedRange = computed(() => {
    const from = this.fromDate();
    return from ? new DateRange<Date>(from, this.toDate() ?? null) : null;
  });
  readonly label = computed(() => {
    const from = this.fromDate();
    const to = this.toDate();
    if (from && to) {
      return `${formatDay(from)} ${this.fromTime()} ~ ${formatDay(to)} ${this.toTime()}`;
    }
    return this.i18n.t('page.system.operationLog.dateRange');
  });

  toggle(): void {
    this.open.update((value) => !value);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.open()) return;
    if (this.host.nativeElement.contains(event.target as Node)) return;
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }

  onSelect(date: Date | null): void {
    if (!date) return;
    const pending = this.pendingStart();
    if (pending) {
      const start = pending <= date ? pending : date;
      const end = pending <= date ? date : pending;
      this.pendingStart.set(null);
      this.emit(start, end);
      return;
    }
    // Starting a fresh range: the React reference keeps both bounds editable
    // and only fills `to` once the second day is picked.
    this.pendingStart.set(date);
    this.emit(date, null);
  }

  changeFromTime(event: Event): void {
    const time = (event.target as HTMLInputElement).value;
    const date = this.fromDate() ?? this.toDate() ?? new Date();
    this.valueChange.emit({
      from: withTime(date, time),
      to: this.value().to || withTime(this.toDate() ?? date, this.toTime()),
    });
  }

  changeToTime(event: Event): void {
    const time = (event.target as HTMLInputElement).value;
    const date = this.toDate() ?? this.fromDate() ?? new Date();
    this.valueChange.emit({
      from: this.value().from || withTime(this.fromDate() ?? date, this.fromTime()),
      to: withTime(date, time),
    });
  }

  selectToday(): void {
    const today = new Date();
    this.pendingStart.set(null);
    this.valueChange.emit({ from: withTime(today, '00:00'), to: withTime(today, '23:59') });
  }

  clear(): void {
    this.pendingStart.set(null);
    this.valueChange.emit({ from: '', to: '' });
  }

  clearFromTrigger(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.clear();
  }

  onClearKey(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    this.clearFromTrigger(event);
  }

  private emit(from: Date | null, to: Date | null): void {
    this.valueChange.emit({
      from: from ? withTime(from, this.fromTime()) : '',
      to: to ? withTime(to, this.toTime()) : '',
    });
  }
}
