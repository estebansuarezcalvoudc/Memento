interface PageContainerProps {
  children: React.ReactNode
}

export default function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start p-8">
      <div className="w-full max-w-4xl">{children}</div>
    </div>
  )
}
