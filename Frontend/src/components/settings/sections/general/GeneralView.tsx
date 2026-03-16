import i18n from 'i18next'
import { useTranslation } from 'react-i18next'

import {
  useSetTheme,
  useTheme,
  type Theme,
} from '../../../../stores/themeStore'
import Select from '../../../ui/inputs/Select'

export default function GeneralView() {
  const { t } = useTranslation()
  const theme = useTheme()
  const setTheme = useSetTheme()

  const currentLanguage = i18n.language?.startsWith('es') ? 'es' : 'en'

  return (
    <>
      <Select
        label={t('settings.general.theme')}
        value={theme}
        onChange={e => setTheme(e.target.value as Theme)}
      >
        <option value="system">{t('settings.general.themeSystem')}</option>
        <option value="light">{t('settings.general.themeLight')}</option>
        <option value="dark">{t('settings.general.themeDark')}</option>
      </Select>
      <Select
        label={t('settings.general.language')}
        value={currentLanguage}
        onChange={e => i18n.changeLanguage(e.target.value)}
      >
        <option value="en">{t('settings.general.languageEnglish')}</option>
        <option value="es">{t('settings.general.languageSpanish')}</option>
      </Select>
    </>
  )
}
