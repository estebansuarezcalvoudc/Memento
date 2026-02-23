interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return <span className="font-ubuntu text-sm text-red-500">{message}</span>
}
