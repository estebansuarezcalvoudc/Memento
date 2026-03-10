export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="font-dongle text-6xl text-stone-800 dark:text-stone-100">
        404 - Page Not Found
      </h1>
      <p className="font-ubuntu mt-4 text-lg text-stone-700 dark:text-stone-300">
        Sorry, the page you are looking for does not exist.
      </p>
    </div>
  )
}
