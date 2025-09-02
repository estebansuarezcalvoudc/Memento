import {
  newChatImage,
  meetingsImage,
  uploadMeetingsImage,
} from "../../assets/buttonsImages";
import Button from "./Button";
import ChatsList from "./ChatsList";

export default function SideBar() {
  return (
    <aside className="fixed h-full w-3/8 px-3 border-r-1 border-stone-300 bg-stone-100 text-stone-50 md:w-72 flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <span className="font-dongle text-6xl uppercase text-stone-700 p-1">
          TFG
        </span>
        {hideSidebarIcon}
      </div>

      <div className="flex-shrink-0">
        <Button svg={newChatImage} text="New Chat" />
        <Button svg={meetingsImage} text="My Meetings" />
        <Button svg={uploadMeetingsImage} text="Upload Meetings" />
      </div>

      <div className="flex-1 min-h-0">
        <ChatsList />
      </div>
    </aside>
  );
}

const hideSidebarIcon = (
  <button className="px-1.5 py-1.5 hover:bg-stone-200 rounded-xl cursor-pointer">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#57534e"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-layout-sidebar-left-collapse"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
      <path d="M9 4v16" />
      <path d="M15 10l-2 2l2 2" />
    </svg>
  </button>
);
