import ChatModelSection from './ChatModelSection'
import RetrievalModelSection from './RetrievalModelSection'

export default function ChatView() {
  return (
    <div className="flex flex-col divide-y divide-gray-300 dark:divide-stone-600">
      <div className="pb-6">
        <ChatModelSection />
      </div>
      <div className="pt-6">
        <RetrievalModelSection />
      </div>
    </div>
  )
}
