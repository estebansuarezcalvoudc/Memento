import { useTranslation } from 'react-i18next'

import { Section } from './sections/Section'
import SettingsSectionButton from './SettingsSectionButton'

interface SettingsSidebarProps {
  section: Section
  setSection: (section: Section) => void
}

const sectionLabelKeys: Record<Section, string> = {
  [Section.General]: 'settings.sections.general',
  [Section.Provider]: 'settings.sections.provider',
  [Section.Transcription]: 'settings.sections.transcription',
  [Section.Summarization]: 'settings.sections.summarization',
  [Section.Chat]: 'settings.sections.chat',
  [Section.Account]: 'settings.sections.account',
}

export default function SettingsSidebar({
  section,
  setSection,
}: SettingsSidebarProps) {
  const { t } = useTranslation()

  return (
    <aside className="flex h-full w-38 flex-col bg-stone-100 px-2 pt-4 text-stone-800 dark:bg-stone-900 dark:text-stone-200">
      {Object.values(Section).map(s => (
        <SettingsSectionButton
          key={s}
          label={t(sectionLabelKeys[s])}
          isSelected={s === section}
          onClick={() => setSection(s)}
        />
      ))}
    </aside>
  )
}
