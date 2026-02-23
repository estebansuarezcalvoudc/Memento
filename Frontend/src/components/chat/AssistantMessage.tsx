interface AssistantMessageProps {
  text: string
}

export default function AssistantMessage({ text }: AssistantMessageProps) {
  return (
    <li className="font-ubuntu mt-4 w-4/5 text-base text-stone-800">{text}</li>
  )
}
