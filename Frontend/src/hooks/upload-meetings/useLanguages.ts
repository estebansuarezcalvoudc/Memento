import { useEffect, useState } from 'react'

const CACHE_KEY = 'supported_languages'
const CACHE_EXPIRY_KEY = 'supported_languages_expiry'
const CACHE_VERSION_KEY = 'supported_languages_version'
const CACHE_VERSION = '2'
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

interface LanguageOption {
  code: string
  name: string
}

export function useLanguages() {
  const [languages, setLanguages] = useState<LanguageOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadLanguages() {
      try {
        const cachedLanguages = getCachedLanguages()
        if (cachedLanguages) {
          setLanguages(cachedLanguages)
          setIsLoading(false)
          return
        }

        const data = await fetchLanguages()
        const transformedLanguages = transformAndCacheLanguages(data)
        setLanguages(transformedLanguages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    loadLanguages()
  }, [])

  return { languages, isLoading, error }
}

function getCachedLanguages(): LanguageOption[] | null {
  const cached = localStorage.getItem(CACHE_KEY)
  const expiry = localStorage.getItem(CACHE_EXPIRY_KEY)
  const version = localStorage.getItem(CACHE_VERSION_KEY)

  if (version && version !== CACHE_VERSION) {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_EXPIRY_KEY)
    localStorage.removeItem(CACHE_VERSION_KEY)
    return null
  }

  const cachedLanguagesAreValid =
    cached &&
    expiry &&
    version === CACHE_VERSION &&
    Date.now() < parseInt(expiry)

  if (cachedLanguagesAreValid) {
    return JSON.parse(cached)
  }

  return null
}

async function fetchLanguages(): Promise<Record<string, string>> {
  const token = localStorage.getItem('access_token')
  const response = await fetch('/api/languages', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch languages')
  }

  const data: Record<string, string> = await response.json()
  return data
}

function transformAndCacheLanguages(
  data: Record<string, string>,
): LanguageOption[] {
  const languageOptions = Object.entries(data)
    .map(([code, name]) => ({
      code,
      name: name.charAt(0).toUpperCase() + name.slice(1),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  localStorage.setItem(CACHE_KEY, JSON.stringify(languageOptions))
  localStorage.setItem(
    CACHE_EXPIRY_KEY,
    (Date.now() + CACHE_DURATION_MS).toString(),
  )
  localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)

  return languageOptions
}
