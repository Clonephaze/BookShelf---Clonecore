export type FontFamily = 'default' | 'sans' | 'atkinson'
export type AccentColor = 'copper' | 'teal' | 'plum' | 'slate' | 'forest'

const STORAGE_KEY = 'bookshelf-appearance'

const FONT_CLASSES: Record<FontFamily, string> = {
  default: '',
  sans: 'font-sans',
  atkinson: 'font-atkinson',
}

const ACCENT_CLASSES: Record<AccentColor, string> = {
  copper: '',
  teal: 'accent-teal',
  plum: 'accent-plum',
  slate: 'accent-slate',
  forest: 'accent-forest',
}

interface AppearanceState {
  fontFamily: FontFamily
  accentColor: AccentColor
  readingComfort: boolean
  simpleShelfView: boolean
}

const defaults: AppearanceState = {
  fontFamily: 'default',
  accentColor: 'copper',
  readingComfort: false,
  simpleShelfView: false,
}

export const useAppearance = () => {
  const state = useState<AppearanceState>('appearance', () => ({ ...defaults }))

  function applyToDOM() {
    if (!import.meta.client) return
    const root = document.documentElement

    // Font classes
    Object.values(FONT_CLASSES).forEach(c => { if (c) root.classList.remove(c) })
    const fontClass = FONT_CLASSES[state.value.fontFamily]
    if (fontClass) root.classList.add(fontClass)

    // Accent classes
    Object.values(ACCENT_CLASSES).forEach(c => { if (c) root.classList.remove(c) })
    const accentClass = ACCENT_CLASSES[state.value.accentColor]
    if (accentClass) root.classList.add(accentClass)

    // Reading comfort
    root.classList.toggle('reading-comfort', state.value.readingComfort)
  }

  function setFont(font: FontFamily) {
    state.value = { ...state.value, fontFamily: font }
    persist()
    applyToDOM()
  }

  function setAccent(accent: AccentColor) {
    state.value = { ...state.value, accentColor: accent }
    persist()
    applyToDOM()
  }

  function setReadingComfort(on: boolean) {
    state.value = { ...state.value, readingComfort: on }
    persist()
    applyToDOM()
  }

  function setSimpleShelfView(on: boolean) {
    state.value = { ...state.value, simpleShelfView: on }
    persist()
  }

  function persist() {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  }

  function initAppearance() {
    if (!import.meta.client) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        state.value = { ...defaults, ...parsed }
      }
    }
    catch { /* corrupt localStorage — use defaults */ }
    applyToDOM()
  }

  return {
    appearance: readonly(state),
    fontFamily: computed(() => state.value.fontFamily),
    accentColor: computed(() => state.value.accentColor),
    readingComfort: computed(() => state.value.readingComfort),
    simpleShelfView: computed(() => state.value.simpleShelfView),
    setFont,
    setAccent,
    setReadingComfort,
    setSimpleShelfView,
    initAppearance,
  }
}
