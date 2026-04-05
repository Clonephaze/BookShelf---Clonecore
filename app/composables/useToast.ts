export interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
  tag?: string
}

const toasts = ref<Toast[]>([])
let nextId = 0
const MAX_TOASTS = 5

export function useToast() {
  function show(message: string, type: Toast['type'] = 'success', duration = 3000, tag?: string) {
    // If a tag is provided, replace any existing toast with the same tag
    if (tag) {
      toasts.value = toasts.value.filter(t => t.tag !== tag)
    }

    // Enforce hard limit — drop oldest when full
    while (toasts.value.length >= MAX_TOASTS) {
      toasts.value.shift()
    }

    const id = ++nextId
    toasts.value.push({ id, message, type, tag })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  function success(message: string, tag?: string) {
    show(message, 'success', 3000, tag)
  }

  function error(message: string) {
    show(message, 'error', 4000)
  }

  return { toasts, show, success, error }
}
