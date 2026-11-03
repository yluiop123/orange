import { describe, expect, it } from 'vitest';
import { clampPage, clampPageAfterDelete } from './page-clamp';

describe('clampPageAfterDelete', () => {
  it('keeps the current page when rows remain on it', () => {
    expect(clampPageAfterDelete(42, 1, 10, 2)).toBe(2);
  });

  it('moves back one page when the last row of the page is deleted', () => {
    expect(clampPageAfterDelete(21, 1, 10, 3)).toBe(2);
  });

  it('never goes below page one', () => {
    expect(clampPageAfterDelete(0, 0, 10, 1)).toBe(1);
    expect(clampPageAfterDelete(3, 10, 10, 3)).toBe(1);
  });

  it('supports deleting several rows at once', () => {
    expect(clampPageAfterDelete(31, 5, 10, 4)).toBe(3);
  });

  it('handles an invalid page size without dividing by zero', () => {
    expect(clampPageAfterDelete(10, 1, 0, 2)).toBe(2);
  });
});

describe('clampPage', () => {
  it('clamps a page to the available range', () => {
    expect(clampPage(9, 21, 10)).toBe(3);
    expect(clampPage(0, 21, 10)).toBe(1);
    expect(clampPage(2, 0, 10)).toBe(1);
  });
});
