import { Section } from './Section'

interface SectionHeaderProps {
  section: Section
}

export default function SectionHeader({ section }: SectionHeaderProps) {
  return (
    <>
      <h1 className="font-ubuntu text-2xl text-stone-800">{section}</h1>
      <hr className="mt-4 mb-2 border-t border-stone-500 opacity-100 transition-opacity duration-300" />
    </>
  )
}
