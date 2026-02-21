import { Section } from './Section'

interface SectionHeaderProps {
  section: Section
}

export default function SectionHeader({ section }: SectionHeaderProps) {
  return (
    <>
      <h1 className="font-ubuntu text-2xl text-stone-800">{section}</h1>
      <hr className="my-4 border-t border-stone-400 opacity-100 transition-opacity duration-300" />
    </>
  )
}
