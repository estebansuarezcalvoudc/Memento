interface AssistantMessageProps {
  text: string
}

export default function AssistantMessage({ text }: AssistantMessageProps) {
  return <li className="w-4/5 mt-4 text-sm font-ubuntu text-stone-800">{text}</li>
}
