import type { ReactNode } from "react";

export default function Button({
  svg,
  text,
}: {
  svg: ReactNode;
  text: string;
}) {
  return (
    <button className="w-full text-stone-700 hover:bg-stone-300 rounded-xl py-2 px-2 text-left flex items-center gap-2">
      {svg}
      <span className="font-ubuntu text-base ml-1.5 truncate">{text}</span>
    </button>
  );
}
