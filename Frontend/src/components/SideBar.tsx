import Button from "./Button";
import ChatButton from "./ChatButton";
import NewChatButton from "./NewChatButton";

export default function SideBar() {
  return (
    <>
      <aside className="fixed h-full w-1/3 px-8 py-16 border-r-2 border-stone-300 bg-stone-100 text-stone-50 md:w-72">
        <h1 className="mb-10 text-5xl font-bold uppercase text-stone-700 text-center">
          TFG
        </h1>
        <ul className="space-y-8">
          <li>
            <Button>My Meetings</Button>
          </li>
          <li>
            <Button>Upload Meetings</Button>
          </li>
        </ul>
        <h2 className="mt-10 text-sm text-stone-400">Chats</h2>
        <hr className="my-2 border-t-1 border-stone-400" />
        <ul>
          <li>
            <NewChatButton />
          </li>
          <li>
            <ChatButton conversationName="Unnamed conversation about tech" />
          </li>
          <li>
            <ChatButton conversationName="conversation 2" />
          </li>
          <li>
            <ChatButton conversationName="conversation 3" />
          </li>
        </ul>
      </aside>
    </>
  );
}
