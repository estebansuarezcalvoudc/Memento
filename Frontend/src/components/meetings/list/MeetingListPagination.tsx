import { useTranslation } from 'react-i18next'

import {
  useMeetingListPage,
  useSetMeetingListPage,
} from '../../../stores/meetingListStore'
import PaginationButton from '../../ui/buttons/PaginationButton'

interface MeetingListPaginationProps {
  totalPages: number
}

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '…')[] = [1]

  if (current > 3) {
    pages.push('…')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('…')
  }

  pages.push(total)
  return pages
}

export default function MeetingListPagination({
  totalPages,
}: MeetingListPaginationProps) {
  const { t } = useTranslation()
  const currentPage = useMeetingListPage()
  const setPage = useSetMeetingListPage()

  if (totalPages <= 1) {
    return null
  }

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      <PaginationButton
        onClick={() => setPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {t('meetings.list.paginationPrev')}
      </PaginationButton>

      {pages.map((p, i) =>
        p === '…' ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-8 min-w-[2rem] items-center justify-center text-sm text-stone-400 dark:text-stone-500"
          >
            …
          </span>
        ) : (
          <PaginationButton
            key={p}
            onClick={() => setPage(p)}
            active={p === currentPage}
          >
            {p}
          </PaginationButton>
        ),
      )}

      <PaginationButton
        onClick={() => setPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {t('meetings.list.paginationNext')}
      </PaginationButton>
    </div>
  )
}
