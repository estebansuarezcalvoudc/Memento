import { useState } from "react";
import ChatOptions from "./ChatOptions";
import ChatButtonSpan from "./ChatButtonSpan";

export default function ChatButton({
  chatTitle: conversationName,
}: {
  chatTitle: string;
}) {
  const [isDivHovered, setDivIsHovered] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const classes = "w-full rounded-xl flex items-center hover:bg-stone-300";

  const openChatButton = (
    <button
      className="text-stone-700 text-left flex-1 truncate py-1.5 rounded-l-xl cursor-pointer"
      onClick={() => console.log("conversation button triggered")}
    >
      <ChatButtonSpan>{conversationName}</ChatButtonSpan>
    </button>
  );

  const toogleOptionsButton = (
    <button
      className="group relative justify-end ml-auto py-1.5 px-2 rounded-r-xl cursor-pointer"
      onClick={() => setDropdownOpen((wasDropdownOpen) => !wasDropdownOpen)}
    >
      {optionsImage}
    </button>
  );

  const chatOptionsDropdown = (
    <div className="absolute right-0 mt-6 z-10">
      <ChatOptions />
    </div>
  );

  return (
    <div
      className={classes}
      onMouseEnter={() => setDivIsHovered(true)}
      onMouseLeave={() => {
        setDivIsHovered(false);
        setDropdownOpen(false);
      }}
    >
      {openChatButton}
      {isDivHovered && toogleOptionsButton}
      {isDropdownOpen && chatOptionsDropdown}
    </div>
  );
}

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
