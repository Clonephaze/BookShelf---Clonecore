/**
 * Lightweight scroll-triggered reveal using IntersectionObserver.
 * Returns a template ref — attach it to a container, and child elements
 * with `data-reveal` will get `.is-visible` when they scroll into view.
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

  onMounted(() => {
    const container = containerRef.value
    if (!container) return

    // Respect reduced-motion: reveal everything immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      container.querySelectorAll('[data-reveal]').forEach((el) => {
        el.classList.add('is-visible')
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            if (once) observer.unobserve(entry.target)
          }
        }
      },
      { threshold, rootMargin },
    )

    container.querySelectorAll('[data-reveal]').forEach((el) => {
      observer.observe(el)
    })

    onUnmounted(() => observer.disconnect())
  })

  return { containerRef }
}
