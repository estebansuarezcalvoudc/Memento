import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import Dialog, { type DialogHandler } from '../ui/layout/Dialog'
import SectionHeader from '../ui/layout/SectionHeader'
import AccountView from './sections/account/AccountView'
import ChatView from './sections/chat/ChatView'
import GeneralView from './sections/general/GeneralView'
import ProvidersView from './sections/providers/ProvidersView'
import { Section } from './sections/Section'
import SummarizationView from './sections/summarization/SummarizationView'
import TranscriptionView from './sections/transcription/TranscriptionView'
import SettingsSidebar from './SettingsSidebar'

const SECTION_VIEWS: Record<Section, React.ComponentType> = {
  [Section.General]: GeneralView,
  [Section.Provider]: ProvidersView,
  [Section.Transcription]: TranscriptionView,
  [Section.Summarization]: SummarizationView,
  [Section.Chat]: ChatView,
  [Section.Account]: AccountView,
}

const sectionTitleKeys: Record<Section, string> = {
  [Section.General]: 'settings.sections.general',
  [Section.Provider]: 'settings.sections.provider',
  [Section.Transcription]: 'settings.sections.transcription',
  [Section.Summarization]: 'settings.sections.summarization',
  [Section.Chat]: 'settings.sections.chat',
  [Section.Account]: 'settings.sections.account',
}

interface SettingsDialogProps {
  dialogRef: React.Ref<DialogHandler>
}

export default function SettingsDialog({ dialogRef }: SettingsDialogProps) {
  const { t } = useTranslation()
  const [section, setSection] = useState<Section>(Section.General)
  const ActiveView = SECTION_VIEWS[section]

  return (
    <Dialog dialogRef={dialogRef}>
      <div className="absolute inset-0 flex">
        <SettingsSidebar section={section} setSection={setSection} />
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-4 pt-4">
            <SectionHeader title={t(sectionTitleKeys[section])} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <ActiveView />
          </div>
        </div>
      </div>
    </Dialog>
  )
}
