interface AddMeetingProps {
  onClick: () => void
  isPending: boolean
}

export default function AddMeetingButton({
  onClick,
  isPending,
}: AddMeetingProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="rounded-lg bg-stone-200 px-2 py-1.5 text-stone-700 disabled:opacity-50"
    >
      + Add meeting
    </button>
  )
}
