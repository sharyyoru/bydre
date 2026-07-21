"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Animate a number from 0 to `target` when the element scrolls into view.
 * Returns [displayValue, ref]. Attach the ref to the element to observe.
 */
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min((now - start) / durationMs, 1)
            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [target, durationMs])

  return [value, ref] as const
}
