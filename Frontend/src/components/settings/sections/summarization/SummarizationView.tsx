import { useState } from 'react'

import {
  useGetDefaultSummarizationPrompt,
  useGetSummarizationPrompt,
  useUpdateSummarizationPrompt,
} from '../../../../api/queries/settings/useSummarizationQueries'
import CancelButton from '../CancelButton'
import ConfirmButton from '../ConfirmButton'
import ErrorMessage from '../ErrorMessage'
import SubSectionTitle from '../SubSectionTitle'

export default function SummarizationView() {
  const { data: promptData, isLoading } = useGetSummarizationPrompt()
  const { data: defaultData } = useGetDefaultSummarizationPrompt()
  const {
    mutate: updatePrompt,
    isPending,
    isError,
  } = useUpdateSummarizationPrompt()

  const [draft, setDraft] = useState<string | undefined>(undefined)

  const value = draft ?? promptData?.systemPrompt ?? ''
  const isModified = draft !== undefined

  function handleSave() {
    updatePrompt(draft!, { onSuccess: () => setDraft(undefined) })
  }

  const MIN = 50
  const MAX = 5000
  const tooShort = value.length < MIN
  const tooLong = value.length > MAX
  const invalid = tooShort || tooLong

  return (
    <div className="flex flex-col gap-4">
      <SubSectionTitle title="Template" />
      {isLoading ? (
        <span className="text-sm text-stone-500">Loading...</span>
      ) : (
        <>
          <textarea
            value={value}
            onChange={e => setDraft(e.target.value)}
            rows={14}
            className="w-full resize-y rounded-md border border-stone-300 bg-white p-3 font-mono text-sm text-stone-800 focus:border-stone-500 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <span
              className={`text-xs ${tooLong ? 'text-red-500' : 'text-stone-400'}`}
            >
              {value.length} / {MAX}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDraft(defaultData?.systemPrompt)}
                disabled={isPending || !defaultData}
                className="font-ubuntu h-8 cursor-pointer rounded-lg px-3 text-sm text-stone-800 hover:bg-stone-300 disabled:opacity-50"
              >
                Reset to default
              </button>
              <CancelButton
                onClick={() => setDraft(undefined)}
                disabled={isPending || !isModified}
              />
              <ConfirmButton
                type="button"
                label="Save"
                isPending={isPending}
                disabled={invalid || !isModified}
                onClick={handleSave}
              />
            </div>
          </div>

          {tooShort && isModified && (
            <ErrorMessage
              message={`Prompt must be at least ${MIN} characters.`}
            />
          )}
          {isError && (
            <ErrorMessage message="Failed to save. Please try again." />
          )}
        </>
      )}
    </div>
  )
}
