import { useState } from 'react'

import Dialog, { type DialogHandler } from '../common/Dialog'
import AccountSettings from './sections/AccountSettings'
import GeneralSettings from './sections/GeneralSettings'
import MeetingProcessingSettings from './sections/MeetingProcessingSettings'
import ProvidersView from './sections/providers/ProvidersView'
import { Section } from './sections/Section'
import SettingsSidebar from './SettingsSidebar'

interface SettingsDialogProps {
  dialogRef: React.Ref<DialogHandler>
}

export default function SettingsDialog({ dialogRef }: SettingsDialogProps) {
  const [section, setSection] = useState<Section>(Section.General)

  return (
    <Dialog dialogRef={dialogRef}>
      <div className="flex h-full">
        <SettingsSidebar section={section} setSection={setSection} />
        <div className="flex-1 overflow-auto p-4">
          {section === Section.General && <GeneralSettings />}
          {section === Section.Provider && <ProvidersView />}
          {section === Section.MeetingsProcessing && (
            <MeetingProcessingSettings />
          )}
          {section === Section.Account && <AccountSettings />}
        </div>
      </div>
    </Dialog>
  )
}
