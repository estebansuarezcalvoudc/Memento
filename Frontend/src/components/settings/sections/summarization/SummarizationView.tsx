import ModelSection from './ModelSection'
import TemplateSection from './TemplateSection'

export default function SummarizationView() {
  return (
    <div className="flex flex-col divide-y divide-gray-300 dark:divide-stone-600">
      <div className="pb-6">
        <TemplateSection />
      </div>
      <div className="pt-6">
        <ModelSection />
      </div>
    </div>
  )
}
