import { useState } from "react";
import ChatOptions from "./ChatOptions";
import ChatButtonSpan from "./ChatButtonSpan";

export default function ChatButton({
  chatTitle: conversationName,
}: {
  chatTitle: string;
}) {
  const [isDivHovered, setDivIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const classes = "w-full rounded-xl flex items-center hover:bg-stone-200";

  const openChatButton = (
    <button
      className="flex-1 cursor-pointer truncate rounded-l-xl py-1.5 text-left text-stone-700"
      onClick={() => console.log("conversation button triggered")}
    >
      <ChatButtonSpan>{conversationName}</ChatButtonSpan>
    </button>
  );

  const shouldShowOptions = isDivHovered || isMenuOpen;

  return (
    <div
      className={classes}
      onMouseEnter={() => setDivIsHovered(true)}
      onMouseLeave={() => setDivIsHovered(false)}
    >
      {openChatButton}
      {shouldShowOptions && <ChatOptions onMenuStateChange={setIsMenuOpen} />}
    </div>
  );
}
