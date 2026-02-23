interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return <span className="font-ubuntu text-base text-red-500">{message}</span>
}
