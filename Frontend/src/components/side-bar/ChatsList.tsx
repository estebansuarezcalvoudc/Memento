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
    <>
      <h2 className="font-ubuntu text-sm ml-1.5 truncate text-stone-400 mt-8">
        Chats
      </h2>
      <ul className="overflow-auto max-h-2/3">
        {conversations.map((title) => (
          <li>
            <ChatButton chatTitle={title} />
          </li>
        ))}
      </ul>
    </>
  );
}
