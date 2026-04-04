import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTheme } from '../../app/composables/useTheme'

const THEME_CLASSES = ['light-mode', 'dark-mode', 'oled-mode']

describe('useTheme', () => {
  beforeEach(() => {
    document.documentElement.classList.remove(...THEME_CLASSES)
    localStorage.clear()
    // Reset shared useState to default
    const { setTheme } = useTheme()
    setTheme('system')
    document.documentElement.classList.remove(...THEME_CLASSES)
    localStorage.clear()
  })

  it('defaults to system theme', () => {
    const { currentTheme } = useTheme()
    expect(currentTheme.value).toBe('system')
  })

  it('setTheme updates the current theme', () => {
    const { setTheme, currentTheme } = useTheme()
    setTheme('dark')
    expect(currentTheme.value).toBe('dark')
  })

  it('setTheme applies the correct CSS class', () => {
    const { setTheme } = useTheme()
    setTheme('oled')
    expect(document.documentElement.classList.contains('oled-mode')).toBe(true)
  })

  it('setTheme removes the previous theme class', () => {
    const { setTheme } = useTheme()
    setTheme('dark')
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true)

    setTheme('oled')
    expect(document.documentElement.classList.contains('dark-mode')).toBe(false)
    expect(document.documentElement.classList.contains('oled-mode')).toBe(true)
  })

  it('setTheme persists to localStorage', () => {
    const { setTheme } = useTheme()
    setTheme('oled')
    expect(localStorage.getItem('bookshelf-theme')).toBe('oled')
  })

  it('system theme removes all theme classes', () => {
    const { setTheme } = useTheme()
    setTheme('dark')
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true)

    setTheme('system')
    for (const cls of THEME_CLASSES) {
      expect(document.documentElement.classList.contains(cls)).toBe(false)
    }
  })

  it('initTheme restores saved theme from localStorage', () => {
    localStorage.setItem('bookshelf-theme', 'dark')
    const { initTheme, currentTheme } = useTheme()
    initTheme()
    expect(currentTheme.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true)
  })

  it('resolvedTheme returns explicit theme when not system', () => {
    const { setTheme, resolvedTheme } = useTheme()
    setTheme('oled')
    expect(resolvedTheme.value).toBe('oled')
  })

  it('resolvedTheme resolves system to dark when user prefers dark', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const { setTheme, resolvedTheme } = useTheme()
    setTheme('system')
    expect(resolvedTheme.value).toBe('dark')
    vi.unstubAllGlobals()
  })

  it('resolvedTheme resolves system to light when user prefers light', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    const { setTheme, resolvedTheme } = useTheme()
    setTheme('system')
    expect(resolvedTheme.value).toBe('light')
    vi.unstubAllGlobals()
  })
})
