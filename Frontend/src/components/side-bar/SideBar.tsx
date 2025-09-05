import {
  meetingsImage,
  newChatImage,
  settingsImage,
  uploadMeetingsImage,
} from '../../assets/buttonsImages'
import { useStore } from '../../store/store'
import Button from './Button'
import ChatsList from './ChatsList'
import Header from './Header'

export default function SideBar() {
  const isSideBarOpen = useStore(state => state.isSideBarOpen)

  return (
    <aside
      className={`fixed flex h-full ${isSideBarOpen ? 'w-3xs' : 'w-15'} flex-col border-r-1 border-stone-300 bg-stone-100 px-3 text-stone-50`}
    >
      <Header />

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

      <Button svg={settingsImage} text="Settings" className="mt-auto mb-2.5" />
    </aside>
  )
}
