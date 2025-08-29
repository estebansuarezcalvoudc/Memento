import type { ReactNode } from "react";

export default function ChatButtonSpan({ children }: { children: ReactNode }) {
  return (
    <span className="font-ubuntu text-sm ml-1.5 truncate">{children}</span>
  );
}
