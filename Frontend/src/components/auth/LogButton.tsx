interface LogButtonProps {
  text: string
  hoverColor: string
  bgColor: string
}

export default function LogButton({
  text,
  hoverColor,
  bgColor,
}: LogButtonProps) {
  return (
    <button
      className={`${hoverColor} ${bgColor} font-ubuntu cursor-pointer rounded-lg border-1 border-stone-400 px-4 py-2 text-base text-stone-800`}
    >
      {text}
    </button>
  )
}
