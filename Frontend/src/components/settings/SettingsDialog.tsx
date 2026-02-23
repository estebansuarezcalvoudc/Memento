import { useState } from 'react'

import Dialog, { type DialogHandler } from '../common/Dialog'
import AccountView from './sections/account/AccountView'
import GeneralView from './sections/general/GeneralView'
import ProvidersView from './sections/providers/ProvidersView'
import { Section } from './sections/Section'
import SectionHeader from './sections/SectionHeader'
import SummarizationView from './sections/summarization/SummarizationView'
import TranscriptionView from './sections/transcription/TranscriptionView'
import SettingsSidebar from './SettingsSidebar'

const SECTION_VIEWS: Record<Section, React.ComponentType> = {
  [Section.General]: GeneralView,
  [Section.Provider]: ProvidersView,
  [Section.Transcription]: TranscriptionView,
  [Section.Summarization]: SummarizationView,
  [Section.Account]: AccountView,
}

interface SettingsDialogProps {
  dialogRef: React.Ref<DialogHandler>
}

export default function SettingsDialog({ dialogRef }: SettingsDialogProps) {
  const [section, setSection] = useState<Section>(Section.General)
  const ActiveView = SECTION_VIEWS[section]

  return (
    <Dialog dialogRef={dialogRef}>
      <div className="absolute inset-0 flex">
        <SettingsSidebar section={section} setSection={setSection} />
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-4 pt-4">
            <SectionHeader section={section} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <ActiveView />
          </div>
        </div>
      </div>
    </Dialog>
  )
}
