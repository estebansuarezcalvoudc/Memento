import type { ReactNode } from 'react'

interface ChatOptionsButtonProps {
  svg: ReactNode
  text: string
  textColor?: string
  hoverColor?: string
}

export default function ChatOptionsButton({
  svg,
  text,
  textColor = 'text-stone-700',
  hoverColor = 'hover:bg-stone-200',
  ...props
}: ChatOptionsButtonProps) {
  return (
    <button
      className={`${textColor} ${hoverColor} m-1 flex w-24 cursor-pointer items-center rounded-xl px-1.5 py-2`}
      {...props}
    >
      {svg}
      <span className="font-ubuntu ml-1.5 text-left text-sm">{text}</span>
    </button>
  )
}
