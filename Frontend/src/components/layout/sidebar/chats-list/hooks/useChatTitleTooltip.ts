import { useEffect, useRef, useState, type RefObject } from 'react'

export type HoverState = 'none' | 'item' | 'title'

const TOOLTIP_DELAY_MS = 1000

interface UseChatTitleTooltipParams {
  inputRef: RefObject<HTMLInputElement | null>
  hoverState: HoverState
  isMenuOpen: boolean
  title: string
}

export function useChatTitleTooltip({
  inputRef,
  hoverState,
  isMenuOpen,
  title,
}: UseChatTitleTooltipParams) {
  const [isTitleTruncatedAtRest, setIsTitleTruncatedAtRest] = useState(false)
  const [isTooltipDelayElapsed, setIsTooltipDelayElapsed] = useState(false)
  const tooltipTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const inputElement = inputRef.current
    if (!inputElement) {
      return
    }

    const checkTruncation = () => {
      if (hoverState !== 'none' || isMenuOpen) {
        return
      }

      setIsTitleTruncatedAtRest(
        inputElement.scrollWidth > inputElement.clientWidth,
      )
    }

    checkTruncation()

    const resizeObserver = new ResizeObserver(checkTruncation)
    resizeObserver.observe(inputElement)

    return () => {
      resizeObserver.disconnect()
    }
  }, [title, hoverState, isMenuOpen, inputRef])

  useEffect(() => {
    if (hoverState === 'title') {
      tooltipTimerRef.current = window.setTimeout(() => {
        setIsTooltipDelayElapsed(true)
      }, TOOLTIP_DELAY_MS)

      return () => {
        if (tooltipTimerRef.current !== null) {
          window.clearTimeout(tooltipTimerRef.current)
          tooltipTimerRef.current = null
        }
      }
    }

    if (tooltipTimerRef.current !== null) {
      window.clearTimeout(tooltipTimerRef.current)
      tooltipTimerRef.current = null
    }
    setIsTooltipDelayElapsed(false)
  }, [hoverState])

  return {
    shouldShowTitleTooltip:
      hoverState === 'title' && isTitleTruncatedAtRest && isTooltipDelayElapsed,
  }
}
