import AuthLink from '../components/auth/AuthLink'
import { useIsUserAuth } from '../stores/authStore'

export default function Home() {
  const isUserAuth = useIsUserAuth()

  return (
    <>
      <h1 className="font-dongle text-center text-8xl text-stone-800 dark:text-stone-100">
        Welcome to TFG
      </h1>
      <span className="font-ubuntu text-lg text-stone-700 dark:text-stone-300">Some text...</span>
      {!isUserAuth && (
        <div className="mt-8 flex justify-center space-x-5">
          <AuthLink
            to="/login"
            text="Log in"
            hoverColor="hover:bg-blue-500"
            bgColor="bg-blue-400"
          />
          <AuthLink
            to="/signup"
            text="Sign up"
            hoverColor="hover:bg-stone-300 dark:hover:bg-stone-600"
            bgColor="bg-white dark:bg-stone-800"
          />
        </div>
      )}
    </>
  )
}
