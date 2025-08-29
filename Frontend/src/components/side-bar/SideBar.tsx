import {
  newChatImage,
  meetingsImage,
  uploadMeetingsImage,
} from "../../assets/buttonsImages";
import Button from "./Button";
import ChatsList from "./ChatsList";

export default function SideBar() {
  return (
    <aside className="fixed h-full w-3/8 px-3 border-r-2 border-stone-300 bg-stone-100 text-stone-50 md:w-72">
      <h1 className="font-dongle mb-2 text-6xl uppercase text-stone-700 text-left">
        TFG
      </h1>

      <Button svg={newChatImage} text="New Chat" />
      <Button svg={meetingsImage} text="My Meetings" />
      <Button svg={uploadMeetingsImage} text="Upload Meetings" />

      <ChatsList />
    </aside>
  );
}
