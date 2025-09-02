import ChatButton from "./ChatButton";

const conversations = [
  "Unnamed conversation",
  "Unnamed conversation 2",
  "Unnamed conversation 3",
  "Unnamed conversation 4",
  "Unnamed conversation 2",
  "Unnamed conversation 3",
  "Unnamed conversation 4",
  "Unnamed conversation 2",
  "Unnamed conversation 3",
  "Unnamed conversation 4",
  "Unnamed conversation 2",
  "Unnamed conversation 3",
  "Unnamed conversation 4",
  "Unnamed conversation 2",
  "Unnamed conversation 3",
  "Unnamed conversation 4",
  "Unnamed conversation 2",
  "Unnamed conversation 3",
  "Unnamed conversation 4",
];

export default function ChatsList() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h2 className="font-ubuntu text-sm ml-1.5 truncate text-stone-400 mt-8 flex-shrink-0 mb-2">
        Chats
      </h2>
      <ul className="flex-1 overflow-y-auto custom-scrollbar">
        {conversations.map((title, index) => (
          <li key={index}>
            <ChatButton chatTitle={title} />
          </li>
        ))}
      </ul>
    </div>
  );
}
