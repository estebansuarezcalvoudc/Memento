import { useState } from 'react'
import Select from '../../common/Select'
import SectionHeader from './SectionHeader'

const APPEARANCE_OPTIONS = ['System', 'Dark', 'Light'] as const
const LANGUAGE_OPTIONS = ['English', 'Spanish'] as const

export default function GeneralSettings() {
  const [appearance, setAppearance] = useState<string>('System')
  const [language, setLanguage] = useState<string>('English')

  // TODO la funcionalidad de cambiar de apariencia y de idioma son tareas a parte

  return (
    <>
      <SectionHeader section="General" />
      <Select<string>
        label="Appearance"
        options={APPEARANCE_OPTIONS as unknown as string[]}
        value={appearance}
        onChange={setAppearance}
        getOptionValue={option => option}
        getOptionLabel={option => option}
      />
      <Select<string>
        label="Language"
        options={LANGUAGE_OPTIONS as unknown as string[]}
        value={language}
        onChange={setLanguage}
        getOptionValue={option => option}
        getOptionLabel={option => option}
      />
    </>
  )
}
