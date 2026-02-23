interface UserMessageProps {
  text: string
}

export default function UserMessage({ text }: UserMessageProps) {
  return (
    <li className="flex justify-end">
      <div className="font-ubuntu mt-4 w-1/2 rounded-2xl bg-stone-200 px-4 py-3 text-base whitespace-pre-line text-stone-800">
        {text}
      </div>
    </li>
  )
}
