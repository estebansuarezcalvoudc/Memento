import Markdown from 'react-markdown'

interface AssistantMessageProps {
  content: string
}

export default function AssistantMessage({ content }: AssistantMessageProps) {
  return (
    <li className="font-ubuntu text-base text-stone-800 dark:text-stone-100 [&_em]:italic [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-2xl [&_h3]:font-semibold [&_li]:mb-1 [&_ol]:mb-4 [&_ol]:ml-6 [&_ol]:list-decimal [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:mb-4 [&_ul]:ml-6 [&_ul]:list-disc">
      <Markdown>{content}</Markdown>
    </li>
  )
}
