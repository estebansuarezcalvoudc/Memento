import { useEffect, useRef } from 'react'

/**
 * Custom hook that manages delayed display of elements for sidebar animations.
 *
 * @param isVisible - Boolean that controls when the element should be visible
 * @param displayValue - CSS display value to use when visible ('block', 'inline', etc.)
 * @param delay - Delay in milliseconds before showing the element (default: 100ms)
 * @returns A ref to attach to the element that needs delayed display
 */
export function useDelayedDisplay<T extends HTMLElement>(
  isVisible: boolean,
  displayValue = 'block',
  delay = 150,
) {
  const elementRef = useRef<T>(null)

  useEffect(() => {
    if (isVisible && elementRef.current) {
      elementRef.current.style.display = 'none'

      const timer = setTimeout(() => {
        if (elementRef.current) {
          elementRef.current.style.display = displayValue
        }
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [isVisible, displayValue, delay])

  return elementRef
}
