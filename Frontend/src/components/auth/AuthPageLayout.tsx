import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthPageLayoutProps {
  title: string
  children: ReactNode
  footerText: string
  linkText: string
  linkTo: string
}

export default function AuthPageLayout({
  title,
  children,
  footerText,
  linkText,
  linkTo,
}: AuthPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center align-middle">
      <div className="rounded-xl border-1 border-stone-400 p-8 dark:border-stone-600">
        <h2 className="font-dongle text-center text-4xl text-stone-700 dark:text-stone-200">
          {title}
        </h2>
        {children}
        <span className="font-ubuntu mt-5 block text-center text-base text-stone-800 dark:text-stone-200">
          {`${footerText} `}
          <Link to={linkTo} className="text-blue-700 underline">
            {linkText}
          </Link>
        </span>
      </div>
    </div>
  )
}
