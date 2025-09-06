interface FormButtonProps {
  text: string
}

export default function FormButton({ text }: FormButtonProps) {
  return (
    <button className="font-ubuntu mt-7 h-10 w-full cursor-pointer rounded-lg bg-lime-500 px-4 py-2 text-base text-stone-800 hover:bg-lime-600">
      {text}
    </button>
  )
}
