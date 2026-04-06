export type FontFamily = 'default' | 'sans' | 'atkinson'
export type AccentColor = 'copper' | 'teal' | 'plum' | 'slate' | 'forest'
export type FontSizeLevel = 'small' | 'default' | 'large' | 'x-large'
export type LineHeightLevel = 'compact' | 'default' | 'relaxed' | 'spacious'

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

const FONT_SIZE_CLASSES: Record<FontSizeLevel, string> = {
  small: 'font-size-small',
  default: '',
  large: 'font-size-large',
  'x-large': 'font-size-x-large',
}

const LINE_HEIGHT_CLASSES: Record<LineHeightLevel, string> = {
  compact: 'line-height-compact',
  default: '',
  relaxed: 'line-height-relaxed',
  spacious: 'line-height-spacious',
}

interface AppearanceState {
  fontFamily: FontFamily
  accentColor: AccentColor
  simpleShelfView: boolean
  fontSize: FontSizeLevel
  lineHeight: LineHeightLevel
  highContrast: boolean
  colorBlindMode: boolean
}

const defaults: AppearanceState = {
  fontFamily: 'default',
  accentColor: 'copper',
  simpleShelfView: false,
  fontSize: 'default',
  lineHeight: 'default',
  highContrast: false,
  colorBlindMode: false,
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

    // Font size classes
    Object.values(FONT_SIZE_CLASSES).forEach(c => { if (c) root.classList.remove(c) })
    const fontSizeClass = FONT_SIZE_CLASSES[state.value.fontSize]
    if (fontSizeClass) root.classList.add(fontSizeClass)

    // Line height classes
    Object.values(LINE_HEIGHT_CLASSES).forEach(c => { if (c) root.classList.remove(c) })
    const lineHeightClass = LINE_HEIGHT_CLASSES[state.value.lineHeight]
    if (lineHeightClass) root.classList.add(lineHeightClass)

    // High contrast
    root.classList.toggle('high-contrast', state.value.highContrast)

    // Color-blind mode
    root.classList.toggle('color-blind', state.value.colorBlindMode)
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

  function setSimpleShelfView(on: boolean) {
    state.value = { ...state.value, simpleShelfView: on }
    persist()
  }

  function setFontSize(size: FontSizeLevel) {
    state.value = { ...state.value, fontSize: size }
    persist()
    applyToDOM()
  }

  function setLineHeight(height: LineHeightLevel) {
    state.value = { ...state.value, lineHeight: height }
    persist()
    applyToDOM()
  }

  function setHighContrast(on: boolean) {
    state.value = { ...state.value, highContrast: on }
    persist()
    applyToDOM()
  }

  function setColorBlindMode(on: boolean) {
    state.value = { ...state.value, colorBlindMode: on }
    persist()
    applyToDOM()
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
    simpleShelfView: computed(() => state.value.simpleShelfView),
    fontSize: computed(() => state.value.fontSize),
    lineHeight: computed(() => state.value.lineHeight),
    highContrast: computed(() => state.value.highContrast),
    colorBlindMode: computed(() => state.value.colorBlindMode),
    setFont,
    setAccent,
    setSimpleShelfView,
    setFontSize,
    setLineHeight,
    setHighContrast,
    setColorBlindMode,
    initAppearance,
  }
}
