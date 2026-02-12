import BaseDialog, { type DialogHandler } from '../common/BaseDialog'
import SettingsForm from './SettingsForm'

export type SettingsDialogHandler = DialogHandler

interface SettingsDialogProps {
  dialogRef: React.Ref<SettingsDialogHandler>
}

export default function SettingsDialog({ dialogRef }: SettingsDialogProps) {
  return (
    <BaseDialog
      dialogRef={dialogRef}
      title="Settings"
      ariaLabelledBy="settings-dialog-title"
      ariaLabel="close-settings-dialog"
    >
      <SettingsForm />
    </BaseDialog>
  )
}
