interface UserMessageProps {
  text: string
}

export default function UserMessage({ text }: UserMessageProps) {
  return (
    <li className="flex justify-end">
      <div className="font-ubuntu mt-4 w-1/2 rounded-lg bg-sky-300 p-2 text-sm whitespace-pre-line text-stone-800">
        {text}
      </div>
    </li>
  )
}
