import { useTranslation } from 'react-i18next'

import { useGetProviders } from '../../../../api/queries/settings/useProvidersQueries'
import Provider from './Provider'

export default function ProvidersView() {
  const { t } = useTranslation()
  const { data: providers, isLoading, error } = useGetProviders()

  let content

  if (isLoading) {
    content = <span>{t('settings.providers.loading')}</span>
  } else if (error) {
    content = (
      <span>
        {t('common.errorPrefix')}
        {error.name}: {error.message}
      </span>
    )
  } else {
    content = (
      <ul className="divide-y divide-gray-300 dark:divide-stone-600">
        {providers?.map((provider, index) => (
          <li key={index} className="py-4">
            <Provider provider={provider} />
          </li>
        ))}
      </ul>
    )
  }

  return <>{content}</>
}
