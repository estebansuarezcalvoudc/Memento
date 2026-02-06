export default function FormErrors({ errors }: { errors: null | string[] }) {
  return (
    errors && (
      <ul className="font-ubuntu mt-7 rounded-lg border-red-800 bg-red-200 px-3 py-1 text-base text-red-800">
        {[...new Set(errors)].map(error => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    )
  )
}
