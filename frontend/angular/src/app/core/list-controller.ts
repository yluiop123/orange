import { DestroyRef, signal, Signal } from '@angular/core';
import { Subject, Subscription, catchError, debounceTime, finalize, merge, of, switchMap } from 'rxjs';
import type { ListParams, PageResult } from './models';
import { clampPageAfterDelete } from './page-clamp';

export type ListFetcher<T> = (params: ListParams) => import('rxjs').Observable<PageResult<T>>;

/**
 * Shared list lifecycle: debounced filters, request cancellation through
 * switchMap, selection, sorting and page clamping after deletions.
 */
export class ListController<T> {
  readonly params = signal<ListParams>({ page: 1, size: 10 });
  readonly rows = signal<T[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly selected = signal<ReadonlySet<string>>(new Set<string>());

  private readonly query$ = new Subject<void>();
  private readonly now$ = new Subject<void>();
  private readonly subscription: Subscription;

  constructor(
    private readonly fetcher: ListFetcher<T>,
    initialParams: ListParams,
    destroyRef: DestroyRef,
  ) {
    this.params.set({ ...initialParams });
    this.subscription = merge(
      this.query$.pipe(debounceTime(300)),
      this.now$,
    )
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          this.error.set(false);
          return this.fetcher(this.params()).pipe(
            catchError(() => {
              this.error.set(true);
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
      )
      .subscribe((result: PageResult<T> | null) => {
        if (!result) {
          this.rows.set([]);
          return;
        }
        this.rows.set(result.list ?? []);
        this.total.set(result.total ?? 0);
      });

    destroyRef.onDestroy(() => this.subscription.unsubscribe());
    this.now$.next();
  }

  reload(debounced = false): void {
    if (debounced) {
      this.query$.next();
    } else {
      this.now$.next();
    }
  }

  updateParams(patch: Partial<ListParams>, debounced = true): void {
    this.params.update((current) => ({ ...current, ...patch, page: 1 }));
    this.reload(debounced);
  }

  setPage(page: number): void {
    this.params.update((current) => ({ ...current, page: Math.max(1, page) }));
    this.reload();
  }

  setSize(size: number): void {
    this.params.update((current) => ({ ...current, size, page: 1 }));
    this.reload();
  }

  /** Toggle sort field/direction. Unsupported fields simply fall back server-side. */
  toggleSort(field: string): void {
    const current = this.params();
    const direction = current['sort'] === field && current['direction'] === 'asc' ? 'desc' : 'asc';
    this.updateParams({ sort: field, direction }, false);
  }

  isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  toggleRow(id: string): void {
    const next = new Set(this.selected());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selected.set(next);
  }

  toggleAll(ids: string[], checked: boolean): void {
    const next = new Set(this.selected());
    for (const id of ids) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    this.selected.set(next);
  }

  clearSelection(): void {
    this.selected.set(new Set<string>());
  }

  /** Clamp the page index after deleting `deleted` rows, then refresh. */
  clampAfterDelete(deleted: number): void {
    const current = this.params();
    const page = clampPageAfterDelete(this.total(), deleted, Number(current['size']), Number(current['page']));
    if (page !== current['page']) {
      this.params.update((value) => ({ ...value, page }));
    }
    this.clearSelection();
    this.reload();
  }
}

export type SelectedIds = Signal<ReadonlySet<string>>;
