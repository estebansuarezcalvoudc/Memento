interface TooltipProps {
  message: string
}

export default function Tooltip({ message }: TooltipProps) {
  return (
    <div className="absolute bottom-full right-0 mb-2 w-max max-w-52 rounded-lg bg-stone-800 px-3 py-1.5 text-center font-ubuntu text-xs text-white shadow-lg">
      {message}
      <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 bg-stone-800" />
    </div>
  )
}
