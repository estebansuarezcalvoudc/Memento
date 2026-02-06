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
      className={`font-ubuntu h-10 cursor-pointer rounded-lg bg-lime-400 px-4 py-2 text-base text-stone-800 hover:bg-lime-500 disabled:opacity-50 ${classes}`}
    >
      {text}
    </button>
  )
}
