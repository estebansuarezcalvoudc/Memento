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
      className={`font-ubuntu mt-7 h-10 w-full cursor-pointer rounded-lg bg-blue-400 text-lg text-stone-800 hover:bg-blue-500 hover:text-black disabled:opacity-50 dark:text-white ${classes ?? ''}`}
    >
      {text}
    </button>
  )
}
