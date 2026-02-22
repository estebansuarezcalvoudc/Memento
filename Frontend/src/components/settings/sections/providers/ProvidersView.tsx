import { useGetProviders } from '../../../../api/queries/settings/useProvidersQueries'
import { Section } from '../Section'
import SectionHeader from '../SectionHeader'
import Provider from './Provider'

export default function ProvidersView() {
  const { data: providers, isLoading, error } = useGetProviders()

  let content

  if (isLoading) {
    content = <span>Loading providers...</span>
  } else if (error) {
    ; <span>
      Error {error.name}: {error.message}
    </span>
  } else {
    content = (
      <ul className='divide-y divide-gray-200'>
        {providers?.map((provider, index) => (
          <li key={index} className='py-4'>
            <Provider provider={provider} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      <SectionHeader section={Section.Provider} />
      {content}
    </>
  )
}
