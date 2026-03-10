import DOMPurify from 'dompurify'

export default function MeetingTranscription({ content }: { content: string }) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
  })

  return (
    <div
      className="font-ubuntu text-base text-stone-800 dark:text-stone-100 [&_p]:mb-4"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}
