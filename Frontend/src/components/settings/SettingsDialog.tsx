import { useState } from 'react'

import BaseDialog, { type DialogHandler } from '../common/BaseDialog'
import AccountSettings from './sections/AccountSettings'
import GeneralSettings from './sections/GeneralSettings'
import MeeetingsProcessingSettings from './sections/MeetingsProcessingSettings'
import ProviderSettings from './sections/ProviderSettings'
import SettingsSidebar from './SettingsSidebar'

export type Section = 'General' | 'Provider' | 'Meetings processing' | 'Account'
export type SettingsDialogHandler = DialogHandler

interface SettingsDialogProps {
  dialogRef: React.Ref<SettingsDialogHandler>
}

export default function SettingsDialog({ dialogRef }: SettingsDialogProps) {
  const [section, setSection] = useState<Section>('General')

  return (
    <BaseDialog
      dialogRef={dialogRef}
      ariaLabelledBy="settings-dialog-title"
      ariaLabel="close-settings-dialog"
    >
      <div className="flex h-full">
        <SettingsSidebar section={section} setSection={setSection} />
        <div className="flex-1 overflow-auto p-6">
          {section === 'General' && <GeneralSettings />}
          {section === 'Provider' && <ProviderSettings />}
          {section === 'Meetings processing' && <MeeetingsProcessingSettings />}
          {section === 'Account' && <AccountSettings />}
        </div>
      </div>
    </BaseDialog>
  )
}
