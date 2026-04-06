/**
 * Lightweight scroll-triggered reveal using IntersectionObserver.
 * Returns a template ref — attach it to a container, and child elements
 * with `data-reveal` will get `.is-visible` when they scroll into view.
 *
 * Call `refresh()` after dynamic content loads to observe newly added elements.
 *
 * Options:
 *  - threshold: visibility ratio to trigger (default 0.15)
 *  - rootMargin: observer root margin (default '0px 0px -40px 0px')
 *  - once: unobserve after first reveal (default true)
 */
export function useScrollReveal(options: {
  threshold?: number
  rootMargin?: string
  once?: boolean
} = {}) {
  const containerRef = ref<HTMLElement | null>(null)
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px', once = true } = options

  let observer: IntersectionObserver | null = null
  let prefersReducedMotion = false

  function observe(container: HTMLElement) {
    container.querySelectorAll('[data-reveal]').forEach((el) => {
      if (prefersReducedMotion) {
        el.classList.add('is-visible')
      }
      else if (observer && !el.classList.contains('is-visible')) {
        observer.observe(el)
      }
    })
  }

  function refresh() {
    const container = containerRef.value
    if (!container) return
    nextTick(() => observe(container))
  }

  onMounted(() => {
    const container = containerRef.value
    if (!container) return

    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!prefersReducedMotion) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              if (once) observer?.unobserve(entry.target)
            }
          }
        },
        { threshold, rootMargin },
      )
    }

    observe(container)

    onUnmounted(() => observer?.disconnect())
  })

  return { containerRef, refresh }
}
