import { useEffect, useRef } from 'react'

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
