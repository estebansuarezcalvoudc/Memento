export default function MeetingTranscription({ content }: { content: string }) {
  return (
    <span
      className="font-ubuntu text-base [&_p]:mb-4"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
