import { Link } from 'react-router-dom'

interface AuthLinkProps {
  text: string
  hoverColor: string
  bgColor: string
  to: string
  border?: string
}

export default function AuthLink({
  text,
  hoverColor,
  bgColor,
  to,
  border,
}: AuthLinkProps) {
  return (
    <Link
      to={to}
      className={`${hoverColor} ${bgColor} ${border} font-ubuntu rounded-lg px-4 py-2 text-base text-stone-800 hover:text-black dark:text-white`}
    >
      {text}
    </Link>
  )
}
