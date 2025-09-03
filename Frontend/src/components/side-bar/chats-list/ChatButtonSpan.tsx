import type { ReactNode } from "react"

export default function ChatButtonSpan({ children }: { children: ReactNode }) {
  return <span className="font-ubuntu ml-1.5 truncate text-sm">{children}</span>
}
