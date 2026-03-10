interface ColumnHeaderProps {
  children: React.ReactNode
  size?: 'xs' | 'base'
}

export default function ColumnHeader({
  children,
  size = 'base',
}: ColumnHeaderProps) {
  const sizeClass = size === 'xs' ? 'text-xs' : 'text-base'

  return (
    <span
      className={`font-ubuntu tracking-wide text-stone-500 uppercase dark:text-stone-400 ${sizeClass}`}
    >
      {children}
    </span>
  )
}
