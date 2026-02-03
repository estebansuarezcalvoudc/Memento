interface UploadMeetingsProps {
  isPending: boolean
}

export default function UploadMeetingsButton({
  isPending,
}: UploadMeetingsProps) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="rounded-lg bg-blue-400 px-2 py-1.5 text-stone-800 disabled:opacity-50"
    >
      {isPending ? 'Uploading...' : 'Submit'}
    </button>
  )
}
