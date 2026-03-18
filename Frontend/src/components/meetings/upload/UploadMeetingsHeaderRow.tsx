import { useTranslation } from 'react-i18next'

import ColumnHeader from '../ColumnHeader'

interface UploadMeetingsHeaderRowProps {
  gridClassName: string
}

export default function UploadMeetingsHeaderRow({
  gridClassName,
}: UploadMeetingsHeaderRowProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`hidden ${gridClassName} items-center gap-x-2 border-b border-stone-300 py-2 min-[800px]:grid min-[800px]:justify-center dark:border-stone-600`}
    >
      <ColumnHeader size="xs">
        {t('meetings.uploadDialog.columns.number')}
      </ColumnHeader>
      <ColumnHeader size="xs">
        {t('meetings.uploadDialog.columns.status')}
      </ColumnHeader>
      <ColumnHeader size="xs">
        {t('meetings.uploadDialog.columns.title')}
      </ColumnHeader>
      <ColumnHeader size="xs">
        {t('meetings.uploadDialog.columns.date')}
      </ColumnHeader>
      <ColumnHeader size="xs">
        {t('meetings.uploadDialog.columns.file')}
      </ColumnHeader>
      <div />
      <div />
    </div>
  )
}
