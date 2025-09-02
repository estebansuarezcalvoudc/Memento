import type { ReactNode } from "react";

export default function Button({
  svg,
  text,
  textColor = "text-stone-700",
}: {
  svg: ReactNode;
  text: string;
  textColor?: string;
}) {
  const classes = `w-full ${textColor} hover:bg-stone-200 rounded-xl py-2 px-2 text-left flex items-center gap-2 cursor-pointer`;

  return (
    <button className={classes}>
      {svg}
      <span className="font-ubuntu text-sm ml-1.5 truncate">{text}</span>
    </button>
  );
}
