import type { ReactNode } from 'react'

import { useStore } from '../../store/store'

interface ButtonProps {
  svg: ReactNode
  text: string
  textColor?: string // Debe ser la clase completa, ej: 'text-red-500'
  hoverColor?: string // Debe ser la clase completa, ej: 'hover:bg-red-200'
  className?: string
}

export default function Button({
  svg,
  text,
  textColor = 'text-stone-700',
  hoverColor = 'hover:bg-stone-200',
  className = '',
  ...props
}: ButtonProps) {
  const isSideBarOpen = useStore(state => state.isSideBarOpen)

  // TODO mejorar cómo cambian los estilos al abrir y cerrar la barra lateral
  const classes = `${isSideBarOpen ? 'flex items-center w-full' : 'w-9'} ${textColor} ${hoverColor} rounded-xl py-2 gap-2 cursor-pointer ${className}`

  return (
    <button className={classes} {...props}>
      <div className="ml-1.5">{svg}</div>
      {isSideBarOpen && (
        <span className="font-ubuntu ml-1.5 text-left text-sm">{text}</span>
      )}
    </button>
  )
}
