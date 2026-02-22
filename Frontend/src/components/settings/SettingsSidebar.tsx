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
    <aside className="flex h-full w-48 flex-col bg-stone-100 px-2 pt-4 text-stone-800">
      <SettingsSectionButton
        label={Section.General}
        isSelected={Section.General === section}
        onClick={() => setSection(Section.General)}
      />
      <SettingsSectionButton
        label={Section.Provider}
        isSelected={Section.Provider === section}
        onClick={() => setSection(Section.Provider)}
      />
      <SettingsSectionButton
        label={Section.MeetingsProcessing}
        isSelected={Section.MeetingsProcessing === section}
        onClick={() => setSection(Section.MeetingsProcessing)}
      />
      <SettingsSectionButton
        label={Section.Account}
        isSelected={Section.Account === section}
        onClick={() => setSection(Section.Account)}
      />
    </aside>
  )
}
