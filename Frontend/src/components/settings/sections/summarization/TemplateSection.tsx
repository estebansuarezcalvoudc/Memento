import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useGetDefaultSummarizationPrompt,
  useGetSummarizationPrompt,
  useUpdateSummarizationPrompt,
} from '../../../../api/queries/settings/useSummarizationQueries'
import ConfirmButton from '../../../ui/buttons/ConfirmButton'
import SecondaryButton from '../../../ui/buttons/SecondaryButton'
import ErrorMessage from '../../../ui/feedback/ErrorMessage'
import SubSectionTitle from '../SubSectionTitle'

const MIN = 50
const MAX = 5000

type Draft = { kind: 'default' } | { kind: 'custom'; text: string }

export default function TemplateSection() {
  const { t, i18n } = useTranslation()
  const currentLanguage = i18n.language?.startsWith('es') ? 'es' : 'en'
  const { data: promptData, isLoading } =
    useGetSummarizationPrompt(currentLanguage)
  const { data: defaultData } =
    useGetDefaultSummarizationPrompt(currentLanguage)
  const {
    mutate: updatePrompt,
    isPending,
    isError,
  } = useUpdateSummarizationPrompt(currentLanguage)

  const [draft, setDraft] = useState<Draft | undefined>(undefined)

  useEffect(() => {
    setDraft(undefined)
  }, [currentLanguage])

  const value =
    draft === undefined
      ? (promptData?.systemPrompt ?? '')
      : draft.kind === 'default'
        ? (defaultData?.systemPrompt ?? '')
        : draft.text

  const isModified = draft !== undefined
  const tooShort = value.length < MIN
  const tooLong = value.length > MAX
  const invalid = tooShort || tooLong

  function handleSave() {
    updatePrompt(value, {
      onSuccess: () => {
        setDraft(undefined)
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <SubSectionTitle title={t('settings.summarization.template')} />
      {isLoading ? (
        <span className="text-base text-stone-500 dark:text-stone-400">
          {t('settings.summarization.loading')}
        </span>
      ) : (
        <>
          <textarea
            value={value}
            onChange={e => setDraft({ kind: 'custom', text: e.target.value })}
            rows={14}
            className="w-full resize-y rounded-md border border-stone-300 bg-white p-3 font-mono text-base text-stone-800 focus:border-stone-500 focus:outline-none dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:focus:border-stone-400"
          />
          <div className="flex items-center justify-between">
            <span
              className={`text-xs ${tooLong ? 'text-red-500' : 'text-stone-400'}`}
            >
              {value.length} / {MAX}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDraft({ kind: 'default' })}
                disabled={isPending || !defaultData}
                className="font-ubuntu h-8 cursor-pointer rounded-lg px-3 text-base text-stone-800 hover:bg-stone-300 disabled:opacity-50 dark:text-stone-200 dark:hover:bg-stone-700"
              >
                {t('settings.summarization.resetToDefault')}
              </button>
              <SecondaryButton
                onClick={() => setDraft(undefined)}
                disabled={isPending || !isModified}
              />
              <ConfirmButton
                type="button"
                label={t('settings.buttons.save')}
                isPending={isPending}
                disabled={invalid || !isModified}
                onClick={handleSave}
              />
            </div>
          </div>
          {tooShort && isModified && (
            <ErrorMessage
              message={t('settings.summarization.promptTooShort', { min: MIN })}
            />
          )}
          {isError && (
            <ErrorMessage message={t('settings.summarization.saveFailed')} />
          )}
        </>
      )}
    </div>
  )
}
