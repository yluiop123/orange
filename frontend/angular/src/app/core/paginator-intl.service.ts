import { Injectable, effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { I18nService } from './i18n.service';

/** Localizes Material paginator labels whenever the app language changes. */
@Injectable()
export class LocalizedPaginatorIntl extends MatPaginatorIntl {
  private readonly i18n = inject(I18nService);

  constructor() {
    super();
    effect(() => {
      // read the signal so label changes re-run on locale switch
      this.i18n.locale();
      this.applyLabels();
    });
  }

  private applyLabels(): void {
    this.itemsPerPageLabel = this.i18n.t('table.itemsPerPage');
    this.nextPageLabel = this.i18n.t('table.next');
    this.previousPageLabel = this.i18n.t('table.previous');
    this.firstPageLabel = this.i18n.t('table.firstPage');
    this.lastPageLabel = this.i18n.t('table.lastPage');
    this.getRangeLabel = (page: number, pageSize: number, length: number): string => {
      if (length === 0 || pageSize === 0) {
        return this.i18n.t('table.range', { start: 0, end: 0, total: length });
      }
      const start = page * pageSize;
      const end = Math.min(start + pageSize, length);
      return this.i18n.t('table.range', { start: start + 1, end, total: length });
    };
    this.changes.next();
  }
}
