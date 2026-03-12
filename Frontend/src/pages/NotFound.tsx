import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="font-dongle text-6xl text-stone-800 dark:text-stone-100">
        {t('notFound.title')}
      </h1>
      <p className="font-ubuntu mt-4 text-lg text-stone-700 dark:text-stone-300">
        {t('notFound.message')}
      </p>
    </div>
  )
}
