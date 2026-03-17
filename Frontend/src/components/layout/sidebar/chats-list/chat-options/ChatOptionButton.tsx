import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ChatOptionsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  svg: ReactNode
  text: string
  textColor?: string
  hoverColor?: string
}

export default function ChatOptionsButton({
  svg,
  text,
  textColor = 'text-stone-700 dark:text-stone-300',
  hoverColor = 'hover:bg-stone-200 dark:hover:bg-stone-700',
  ...props
}: ChatOptionsButtonProps) {
  return (
    <button
      className={`${textColor} ${hoverColor} flex w-full cursor-pointer items-center gap-1.5 rounded-xl px-2 py-2 whitespace-nowrap`}
      {...props}
    >
      <span className="shrink-0">{svg}</span>
      <span className="font-ubuntu text-left text-base">{text}</span>
    </button>
  )
}
