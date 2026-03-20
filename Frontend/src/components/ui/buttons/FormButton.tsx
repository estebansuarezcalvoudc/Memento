interface FormButtonProps {
  text: string
  isPending: boolean
  classes?: string
}

export default function FormButton({
  text,
  isPending,
  classes,
}: FormButtonProps) {
  return (
    <button
      disabled={isPending}
      className={`font-ubuntu mt-7 h-10 w-full cursor-pointer rounded-lg bg-lime-400 text-lg text-stone-800 hover:bg-lime-500 disabled:opacity-50 ${classes ?? ''}`}
    >
      {text}
    </button>
  )
}
