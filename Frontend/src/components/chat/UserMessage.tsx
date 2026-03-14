interface UserMessageProps {
  content: string
}

export default function UserMessage({ content }: UserMessageProps) {
  return (
    <li className="flex justify-end">
      <div className="font-ubuntu max-w-xl rounded-xl bg-stone-200 px-3 py-2 text-base dark:bg-stone-700 dark:text-stone-100">
        {content}
      </div>
    </li>
  )
}
