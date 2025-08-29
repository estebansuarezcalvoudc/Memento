import { useState } from "react";
import ChatButtonSpan from "./ChatButtonSpan";

const editImage = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon icon-tabler icons-tabler-outline icon-tabler-pencil"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);

const deleteImage = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon icon-tabler icons-tabler-outline icon-tabler-trash"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 7l16 0" />
    <path d="M10 11l0 6" />
    <path d="M14 11l0 6" />
    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
  </svg>
);

const optionsImage = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#000000"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon icon-tabler icons-tabler-outline icon-tabler-dots mr-1.5"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
  </svg>
);

export default function ChatButton({
  conversationName,
}: {
  conversationName: string;
}) {
  const [isDivHovered, setDivIsHovered] = useState(false);

  const classes = "w-full rounded-xl flex items-center hover:bg-stone-300";

  return (
    <div
      className={classes}
      onMouseEnter={() => setDivIsHovered(true)}
      onMouseLeave={() => setDivIsHovered(false)}
    >
      <button
        className="text-stone-700 text-left flex-1 truncate py-1.5 rounded-l-xl"
        onClick={() => console.log("conversation button triggered")}
      >
        <ChatButtonSpan>{conversationName}</ChatButtonSpan>
      </button>
      {isDivHovered && (
        <button
          className="justify-end ml-auto py-1.5 px-2 rounded-r-xl"
          onClick={() => console.log("options button triggered")}
        >
          {optionsImage}
        </button>
      )}
    </div>
  );
}
