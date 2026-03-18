import { type UploadMeetingsState } from '../../../api/meetings/useUploadMeetings'

interface UploadProgressSummaryProps {
  processed: number
  total: number
  succeeded: number
  failed: number
  progressPercent: number
  phase: UploadMeetingsState['phase']
}

export default function UploadProgressSummary({
  processed,
  total,
  succeeded,
  failed,
  progressPercent,
  phase,
}: UploadProgressSummaryProps) {
  const totalSafe = total > 0 ? total : 0
  const textColor =
    phase === 'failed'
      ? 'text-red-700 dark:text-red-400'
      : 'text-stone-700 dark:text-stone-300'

  return (
    <div
      className={`my-4 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm ${textColor} dark:border-stone-700 dark:bg-stone-800`}
    >
      <div className="font-ubuntu flex items-center justify-between">
        <span>
          {processed}/{totalSafe} · {progressPercent}%
        </span>
        <span>
          OK: {succeeded} · ERR: {failed}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-stone-200 dark:bg-stone-700">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}
