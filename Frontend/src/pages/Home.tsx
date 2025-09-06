import LogButton from '../components/auth/LogButton'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center align-middle">
      <h1 className="font-dongle text-center text-8xl text-stone-800">
        Welcome to TFG
      </h1>
      <span className="font-ubuntu text-lg text-stone-700">Some text...</span>
      <div className="mt-8 flex justify-center space-x-5">
        <LogButton
          text="Sign in"
          hoverColor="hover:bg-blue-500"
          bgColor="bg-blue-400"
        />
        <LogButton
          text="Sign up"
          hoverColor="hover:bg-stone-300"
          bgColor="bg-white"
        />
      </div>
    </div>
  )
}
