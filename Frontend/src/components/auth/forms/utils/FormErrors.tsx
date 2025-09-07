export default function FormErrors({ errors }: { errors: null | string[] }) {
  return (
    errors && (
      <ul className="font-ubuntu mt-8 rounded-lg border-red-700 bg-red-200 px-3 py-1 text-sm text-red-700">
        {[...new Set(errors)].map(error => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    )
  )
}
