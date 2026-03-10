import { useState } from 'react'

import InlineButton from '../../ui/InlineButton'
import PullModelForm from './PullModelForm'

interface PullModelSectionProps {
  providerName: string
}

export default function PullModelSection({
  providerName,
}: PullModelSectionProps) {
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
    <InlineButton onClick={() => setIsAdding(true)}>Pull model</InlineButton>
  )
}
