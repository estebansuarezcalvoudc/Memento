import { useTranslation } from 'react-i18next'

import { Section } from './Section'

interface SectionHeaderProps {
  section: Section
}

const sectionTitleKeys: Record<Section, string> = {
  [Section.General]: 'settings.sections.general',
  [Section.Provider]: 'settings.sections.provider',
  [Section.Transcription]: 'settings.sections.transcription',
  [Section.Summarization]: 'settings.sections.summarization',
  [Section.Chat]: 'settings.sections.chat',
  [Section.Account]: 'settings.sections.account',
}

export default function SectionHeader({ section }: SectionHeaderProps) {
  const { t } = useTranslation()

  return (
    <>
      <h1 className="font-ubuntu text-2xl text-stone-800 dark:text-stone-100">
        {t(sectionTitleKeys[section])}
      </h1>
      <hr className="mt-4 mb-4 border-t border-stone-500 opacity-100 transition-opacity duration-300 dark:border-stone-600" />
    </>
  )
}
