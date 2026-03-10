import { Section } from './Section'

interface SectionHeaderProps {
  section: Section
}

export default function SectionHeader({ section }: SectionHeaderProps) {
  return (
    <>
      <h1 className="font-ubuntu text-2xl text-stone-800 dark:text-stone-100">{section}</h1>
      <hr className="mt-4 mb-4 border-t border-stone-500 opacity-100 transition-opacity duration-300 dark:border-stone-600" />
    </>
  )
}
