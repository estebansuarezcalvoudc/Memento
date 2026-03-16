interface SectionHeaderProps {
  title: string
  titleId?: string
  centered?: boolean
  titleSize?: 'md' | 'lg'
}

export default function SectionHeader({
  title,
  titleId,
  centered = false,
  titleSize = 'md',
}: SectionHeaderProps) {
  const titleAlignmentClass = centered ? 'text-center' : ''
  const titleSizeClass = titleSize === 'lg' ? 'text-3xl' : 'text-2xl'

  return (
    <>
      <h1
        id={titleId}
        className={`font-ubuntu ${titleAlignmentClass} ${titleSizeClass} text-stone-800 dark:text-stone-100`}
      >
        {title}
      </h1>
      <hr className="mt-4 mb-4 border-t border-stone-500 opacity-100 transition-opacity duration-300 dark:border-stone-600" />
    </>
  )
}
