import { useGetProviders } from '../../../../api/queries/settings/useProvidersQueries'
import Provider from './Provider'

export default function ProvidersView() {
  const { data: providers, isLoading, error } = useGetProviders()

  let content

  if (isLoading) {
    content = <span>Loading providers...</span>
  } else if (error) {
    content = (
      <span>
        Error {error.name}: {error.message}
      </span>
    )
  } else {
    content = (
      <ul className="divide-y divide-gray-300">
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
