import type { Section } from './SettingsDialog'
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
    <aside className="flex h-full w-48 flex-col bg-stone-100 py-6 px-2  text-stone-800">
      <SettingsSectionButton
        label="General"
        isSelected={'General' === section}
        onClick={() => setSection('General')}
      />
      <SettingsSectionButton
        label="Provider"
        isSelected={'Provider' === section}
        onClick={() => setSection('Provider')}
      />
      <SettingsSectionButton
        label="Meetings processing"
        isSelected={'Meetings processing' === section}
        onClick={() => setSection('Meetings processing')}
      />
      <SettingsSectionButton
        label="Account"
        isSelected={'Account' === section}
        onClick={() => setSection('Account')}
      />
    </aside>
  )
}
