export default function FormErrors({ errors }: { errors: null | string[] }) {
  return (
    errors && (
      <ul className="font-ubuntu mt-7 rounded-lg bg-red-300 px-3 py-1 text-base text-red-800">
        {[...new Set(errors)].map(error => (
          <li key={error} className="py-0.5">
            {error}
          </li>
        ))}
      </ul>
    )
  )
}
