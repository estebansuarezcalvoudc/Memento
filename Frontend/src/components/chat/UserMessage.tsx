interface UserMessageProps {
  content: string
}

export default function UserMessage({ content }: UserMessageProps) {
  return (
    <li className="flex justify-end">
      <div className="font-ubuntu mt-4 w-1/2 rounded-2xl bg-stone-200 px-4 py-3 text-base whitespace-pre-line text-stone-800 dark:bg-stone-700 dark:text-stone-100">
        {content}
      </div>
    </li>
  )
}
