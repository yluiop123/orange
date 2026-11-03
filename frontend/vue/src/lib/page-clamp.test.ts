import { describe, expect, it } from 'vitest'
import { clampPageAfterDelete } from './page-clamp'

describe('clampPageAfterDelete', () => {
  it('stays on the current page while data remains', () => {
    expect(clampPageAfterDelete(42, 1, 10, 2)).toBe(2)
  })

  it('moves back when the last page becomes empty', () => {
    expect(clampPageAfterDelete(21, 1, 10, 3)).toBe(2)
    expect(clampPageAfterDelete(10, 10, 10, 1)).toBe(1)
    expect(clampPageAfterDelete(0, 0, 10, 4)).toBe(1)
  })

  it('handles multiple deletions and custom page sizes', () => {
    expect(clampPageAfterDelete(100, 45, 20, 5)).toBe(3)
    expect(clampPageAfterDelete(15, 5, 5, 3)).toBe(2)
  })
})
