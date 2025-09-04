import type { ReactNode } from 'react'

export default function Button({
  svg,
  text,
  textColor = 'text-stone-700',
  hoverColor = 'hover:bg-stone-200',
  className = '',
}: {
  svg: ReactNode
  text: string
  textColor?: string // Debe ser la clase completa, ej: 'text-red-500'
  hoverColor?: string // Debe ser la clase completa, ej: 'hover:bg-red-200'
  className?: string
}) {
  const classes = `w-full ${textColor} ${hoverColor} rounded-xl py-2 px-2 text-left flex items-center gap-2 cursor-pointer ${className}`

  return (
    <button className={classes}>
      {svg}
      <span className="font-ubuntu ml-1.5 truncate text-sm">{text}</span>
    </button>
  )
}
