import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useReducer, useRef } from 'react'

import { type MeetingUploadEvent } from './meetingEvents'
import { uploadMeetingsStream } from './uploadMeetingsStream'

const MEETINGS_QUERY_KEY = ['meetings'] as const

export type MeetingProcessingStatus =
  | 'waiting'
  | 'processing'
  | 'succeeded'
  | 'failed'

type UploadPhase =
  | 'idle'
  | 'uploading'
  | 'completed'
  | 'completedWithErrors'
  | 'failed'
  | 'aborted'

interface UploadError {
  index: number
  title: string
  error: string
}

export interface UploadMeetingsState {
  phase: UploadPhase
  total: number
  processed: number
  succeeded: number
  failed: number
  currentTitle: string | null
  errors: UploadError[]
  meetingStatuses: MeetingProcessingStatus[]
  lastEvent: MeetingUploadEvent | null
  errorMessage: string | null
}

type UploadMeetingsAction =
  | { type: 'start'; payload: { meetingsCount: number } }
  | { type: 'event'; payload: MeetingUploadEvent }
  | { type: 'error'; payload: string }
  | { type: 'aborted' }
  | { type: 'reset' }

const initialState: UploadMeetingsState = {
  phase: 'idle',
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  currentTitle: null,
  errors: [],
  meetingStatuses: [],
  lastEvent: null,
  errorMessage: null,
}

export default function useUploadMeetings() {
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(uploadMeetingsReducer, initialState)
  const abortControllerRef = useRef<AbortController | null>(null)

  const startUpload = useCallback(
    async (
      formData: FormData,
      meetingsCount: number,
    ): Promise<UploadMeetingsState> => {
      abortControllerRef.current?.abort()

      const controller = new AbortController()
      abortControllerRef.current = controller

      dispatch({ type: 'start', payload: { meetingsCount } })

      let finalState: UploadMeetingsState = {
        ...initialState,
        phase: 'uploading',
        total: meetingsCount,
        meetingStatuses: createWaitingStatuses(meetingsCount),
      }

      try {
        await uploadMeetingsStream({
          formData,
          signal: controller.signal,
          onEvent: event => {
            finalState = uploadMeetingsReducer(finalState, {
              type: 'event',
              payload: event,
            })
            dispatch({ type: 'event', payload: event })
          },
        })

        if (finalState.succeeded > 0) {
          await queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY })
        }

        return finalState
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          dispatch({ type: 'aborted' })
          return {
            ...finalState,
            phase: 'aborted',
            errorMessage: null,
          }
        }

        const message = getErrorMessage(error)
        dispatch({ type: 'error', payload: message })
        return {
          ...finalState,
          phase: 'failed',
          errorMessage: message,
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }
      }
    },
    [queryClient],
  )

  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'reset' })
  }, [])

  const progressPercent = useMemo(() => {
    if (state.total === 0) {
      return 0
    }

    return Math.round((state.processed / state.total) * 100)
  }, [state.processed, state.total])

  return {
    state,
    isPending: state.phase === 'uploading',
    progressPercent,
    startUpload,
    cancelUpload,
    reset,
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Unknown error while uploading meetings'
}

function createWaitingStatuses(count: number): MeetingProcessingStatus[] {
  return Array.from({ length: count }, () => 'waiting')
}

function updateStatusAtIndex(
  statuses: MeetingProcessingStatus[],
  index: number,
  status: MeetingProcessingStatus,
): MeetingProcessingStatus[] {
  if (index < 0 || index >= statuses.length) {
    return statuses
  }

  const nextStatuses = [...statuses]
  nextStatuses[index] = status
  return nextStatuses
}

function uploadMeetingsReducer(
  state: UploadMeetingsState,
  action: UploadMeetingsAction,
): UploadMeetingsState {
  if (action.type === 'start') {
    return {
      ...initialState,
      phase: 'uploading',
      total: action.payload.meetingsCount,
      meetingStatuses: createWaitingStatuses(action.payload.meetingsCount),
    }
  }

  if (action.type === 'event') {
    const event = action.payload

    if (event.type === 'JobStarted') {
      return {
        ...state,
        total: event.totalMeetings,
        lastEvent: event,
      }
    }

    if (event.type === 'MeetingProcessingStarted') {
      return {
        ...state,
        currentTitle: event.title,
        meetingStatuses: updateStatusAtIndex(
          state.meetingStatuses,
          event.index,
          'processing',
        ),
        lastEvent: event,
      }
    }

    if (event.type === 'MeetingProcessingSucceeded') {
      return {
        ...state,
        processed: state.processed + 1,
        succeeded: state.succeeded + 1,
        currentTitle: null,
        meetingStatuses: updateStatusAtIndex(
          state.meetingStatuses,
          event.index,
          'succeeded',
        ),
        lastEvent: event,
      }
    }

    if (
      event.type === 'MeetingProcessingError' ||
      event.type === 'MeetingProcessingFailed'
    ) {
      return {
        ...state,
        processed: state.processed + 1,
        failed: state.failed + 1,
        currentTitle: null,
        meetingStatuses: updateStatusAtIndex(
          state.meetingStatuses,
          event.index,
          'failed',
        ),
        errors: [
          ...state.errors,
          {
            index: event.index,
            title: event.title,
            error: event.error,
          },
        ],
        lastEvent: event,
      }
    }

    return {
      ...state,
      processed: event.meetingsSucceeded + event.meetingsFailed,
      succeeded: event.meetingsSucceeded,
      failed: event.meetingsFailed,
      currentTitle: null,
      phase: event.meetingsFailed > 0 ? 'completedWithErrors' : 'completed',
      lastEvent: event,
    }
  }

  if (action.type === 'error') {
    return {
      ...state,
      phase: 'failed',
      currentTitle: null,
      errorMessage: action.payload,
    }
  }

  if (action.type === 'aborted') {
    return {
      ...state,
      phase: 'aborted',
      currentTitle: null,
      errorMessage: null,
    }
  }

  return initialState
}
