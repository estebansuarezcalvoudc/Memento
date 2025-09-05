import {
  meetingsImage,
  newChatImage,
  settingsImage,
  uploadMeetingsImage,
} from '../../assets/buttonsImages'
import { useSideBarStore } from '../../stores/sideBarStore'
import Button from './Button'
import ChatsList from './ChatsList'
import Header from './Header'

export default function SideBar() {
  const isSideBarOpen = useSideBarStore(state => state.isSideBarOpen)

  const buttons = [
    { image: newChatImage, text: 'New Chat' },
    { image: meetingsImage, text: 'My Meetings' },
    { image: uploadMeetingsImage, text: 'Upload Meetings' },
  ]

  return (
    <aside
      className={`fixed flex h-full ${isSideBarOpen ? 'w-3xs' : 'w-15'} flex-col border-r-1 border-stone-300 bg-stone-100 px-3 text-stone-50 shadow-2xl transition-all duration-300 ease-in-out`}
    >
      <Header />

      <ul className="flex-shrink-0">
        {buttons.map(button => (
          <li id={button.text}>
            <Button svg={button.image} text={button.text} />
          </li>
        ))}
      </ul>

      <div
        className={`min-h-0 flex-1 transition-opacity duration-300 ${
          isSideBarOpen ? 'opacity-100 delay-150' : 'opacity-0 delay-[0ms]'
        }`}
        style={{
          display: isSideBarOpen ? 'block' : 'none',
        }}
      >
        <ChatsList />
      </div>

      <hr
        className={`my-4 border-t border-stone-400 transition-opacity duration-300 ${
          isSideBarOpen ? 'opacity-100 delay-150' : 'opacity-0 delay-[0ms]'
        }`}
        style={{
          display: isSideBarOpen ? 'block' : 'none',
        }}
      />

      <Button svg={settingsImage} text="Settings" className="mt-auto mb-2.5" />
    </aside>
  )
}
