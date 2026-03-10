import { Section } from './sections/Section'
import SettingsSectionButton from './SettingsSectionButton'

interface SettingsSidebarProps {
  section: Section
  setSection: (section: Section) => void
}

export default function SettingsSidebar({
  section,
  setSection,
}: SettingsSidebarProps) {
  return (
    <aside className="flex h-full w-48 flex-col bg-stone-100 px-2 pt-4 text-stone-800 dark:bg-stone-900 dark:text-stone-200">
      {Object.values(Section).map(s => (
        <SettingsSectionButton
          key={s}
          label={s}
          isSelected={s === section}
          onClick={() => setSection(s)}
        />
      ))}
    </aside>
  )
}
