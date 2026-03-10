import { Link } from 'react-router-dom'

interface AuthLinkProps {
  text: string
  hoverColor: string
  bgColor: string
  to: string
}

export default function AuthLink({
  text,
  hoverColor,
  bgColor,
  to,
}: AuthLinkProps) {
  return (
    <Link
      to={to}
      className={`${hoverColor} ${bgColor} font-ubuntu rounded-lg border-1 border-stone-400 px-4 py-2 text-base text-stone-800 dark:border-stone-600 dark:text-stone-100`}
    >
      {text}
    </Link>
  )
}
