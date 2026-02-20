import DOMPurify from 'dompurify'

export default function MeetingTranscription({ content }: { content: string }) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
  })

  return (
    <div
      className="font-ubuntu text-base [&_p]:mb-4"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}
