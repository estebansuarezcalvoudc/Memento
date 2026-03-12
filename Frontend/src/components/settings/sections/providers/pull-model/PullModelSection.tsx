import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import InlineButton from '../../ui/InlineButton'
import PullModelForm from './PullModelForm'

interface PullModelSectionProps {
  providerName: string
}

export default function PullModelSection({
  providerName,
}: PullModelSectionProps) {
  const { t } = useTranslation()
  const [isAdding, setIsAdding] = useState(false)

  if (isAdding) {
    return (
      <PullModelForm
        providerName={providerName}
        onClose={() => setIsAdding(false)}
      />
    )
  }

  return (
    <InlineButton onClick={() => setIsAdding(true)}>
      {t('settings.providers.pullModel')}
    </InlineButton>
  )
}
