/**
 * Lightweight confetti celebration using CSS animations.
 * Creates colored particles that burst from center-top and fade out.
 */
export function useConfetti() {
  function fire() {
    if (import.meta.server) return

    const container = document.createElement('div')
    Object.assign(container.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '9999',
      overflow: 'hidden',
    })
    document.body.appendChild(container)

    const colors = ['#d4a03e', '#a0592a', '#3d7c4f', '#c0392b', '#5c4a38', '#e8614d', '#5aaf6e']
    const count = 60

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div')
      const color = colors[Math.floor(Math.random() * colors.length)]
      const size = 4 + Math.random() * 6
      const angle = Math.random() * Math.PI * 2
      const velocity = 200 + Math.random() * 400
      const tx = Math.cos(angle) * velocity
      const ty = Math.sin(angle) * velocity - 200  // bias upward
      const rotation = Math.random() * 720 - 360
      const duration = 1.2 + Math.random() * 0.8

      Object.assign(particle.style, {
        position: 'absolute',
        left: '50%',
        top: '40%',
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        transform: 'translate(-50%, -50%)',
        animation: `confetti-burst ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
        // Use custom properties for per-particle randomness
        '--tx': `${tx}px`,
        '--ty': `${ty}px`,
        '--rot': `${rotation}deg`,
      } as Record<string, string>)

      container.appendChild(particle)
    }

    // Inject keyframes if not already present
    if (!document.getElementById('confetti-keyframes')) {
      const style = document.createElement('style')
      style.id = 'confetti-keyframes'
      style.textContent = `
        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          10% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(-50% + var(--tx)),
              calc(-50% + var(--ty))
            ) rotate(var(--rot)) scale(0.5);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }

    // Clean up after animation completes
    setTimeout(() => {
      container.remove()
    }, 2500)
  }

  return { fire }
}
