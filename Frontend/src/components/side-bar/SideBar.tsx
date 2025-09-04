import {
  meetingsImage,
  newChatImage,
  settingsImage,
  uploadMeetingsImage,
} from '../../assets/buttonsImages'
import { useStore } from '../../store/store'
import Button from './Button'
import ChatsList from './ChatsList'

export default function SideBar() {
  const isSideBarOpen = useStore(state => state.isSideBarOpen)
  const toogleSideBar = useStore(state => state.toogleSideBar)

  return (
    <aside
      className={`fixed flex h-full ${isSideBarOpen ? 'w-3xs' : 'w-14'} flex-col border-r-1 border-stone-300 bg-stone-100 px-3 text-stone-50`}
    >
      <div className="mt-5 mb-3 flex h-8 flex-shrink-0 items-center justify-between">
        {isSideBarOpen && (
          <span className="font-dongle p-1 text-6xl text-stone-700 uppercase">
            TFG
          </span>
        )}
        <button
          className="cursor-pointer rounded-xl px-1.5 py-1.5 hover:bg-stone-200"
          onClick={toogleSideBar}
        >
          {isSideBarOpen ? hideSidebarIcon : showSidebarIcon}
        </button>
      </div>

      <div className="flex-shrink-0">
        <Button svg={newChatImage} text="New Chat" />
        <Button svg={meetingsImage} text="My Meetings" />
        <Button svg={uploadMeetingsImage} text="Upload Meetings" />
      </div>

      {isSideBarOpen && (
        <>
          <div className="min-h-0 flex-1">
            <ChatsList />
          </div>
          <hr className="my-4 border-t border-stone-400" />
        </>
      )}

      <Button
        svg={settingsImage}
        text="Settings"
        className="mt-auto mb-2.5"
      />
    </aside>
  )
}

const hideSidebarIcon = (
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
)

const showSidebarIcon = (
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
    className="icon icon-tabler icons-tabler-outline icon-tabler-layout-sidebar-left-expand"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
    <path d="M9 4v16" />
    <path d="M14 10l2 2l-2 2" />
  </svg>
)
