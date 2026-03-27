import { createPortal } from 'react-dom'

interface ChatTitleTooltipProps {
  visible: boolean
  title: string
  anchorElement: HTMLAnchorElement | null
}

export default function ChatTitleTooltip({
  visible,
  title,
  anchorElement,
}: ChatTitleTooltipProps) {
  if (!visible || !anchorElement) {
    return null
  }

  const rect = anchorElement.getBoundingClientRect()
  const position = {
    top: rect.top - 8,
    left: rect.left + 6,
  }

  return createPortal(
    <div
      className="font-ubuntu pointer-events-none fixed z-[9999] max-w-80 -translate-y-full rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-700 shadow-md dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
      style={position}
    >
      {title}
    </div>,
    document.body,
  )
}
