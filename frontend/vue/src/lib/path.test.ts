import { describe, expect, it } from 'vitest'
import { isPathWithin, isSafeInternalPath, isSamePath, normalizePath } from './path'

describe('path helpers', () => {
  it('normalizes trailing and leading slashes', () => {
    expect(normalizePath('/system/user/')).toBe('/system/user')
    expect(normalizePath('system')).toBe('/system')
    expect(normalizePath('/')).toBe('/')
  })

  it('does not match a partial segment', () => {
    expect(isPathWithin('/systematic', '/system')).toBe(false)
    expect(isPathWithin('/system/user', '/system')).toBe(true)
    expect(isSamePath('/system/user/', '/system/user')).toBe(true)
  })

  it('only accepts safe internal redirects', () => {
    expect(isSafeInternalPath('/system/user')).toBe(true)
    expect(isSafeInternalPath('//evil.example')).toBe(false)
    expect(isSafeInternalPath('https://evil.example')).toBe(false)
    expect(isSafeInternalPath('/a\\b')).toBe(false)
  })
})
