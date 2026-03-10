export default function Header({ text }: { text: string }) {
  return (
    <h1 className="font-ubuntu text-4xl font-bold text-stone-800 dark:text-stone-100">
      {text}
    </h1>
  )
}
