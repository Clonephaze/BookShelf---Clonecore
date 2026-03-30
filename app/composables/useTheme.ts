export type Theme = 'light' | 'dark' | 'sepia' | 'contrast' | 'system'

const STORAGE_KEY = 'bookshelf-theme'
const THEME_CLASSES = ['light-mode', 'dark-mode', 'sepia-mode', 'contrast-mode']

export const useTheme = () => {
  const currentTheme = useState<Theme>('theme', () => 'system')

  const resolvedTheme = computed<Exclude<Theme, 'system'>>(() => {
    if (currentTheme.value !== 'system') return currentTheme.value

    if (import.meta.client) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme

    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, theme)

      // Remove all theme classes
      document.documentElement.classList.remove(...THEME_CLASSES)

      // Add the new theme class (unless 'system' — let CSS handle it)
      if (theme !== 'system') {
        document.documentElement.classList.add(`${theme}-mode`)
      }
    }
  }

  const initTheme = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
      if (stored) {
        setTheme(stored)
      }
    }
  }

  return {
    currentTheme: readonly(currentTheme),
    resolvedTheme,
    setTheme,
    initTheme,
  }
}
