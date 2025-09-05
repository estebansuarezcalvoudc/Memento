import { useDelayedDisplay } from '../../hooks/useDelayedDisplay'
import { useSidebarStore } from '../../stores/sidebarStore'

export default function Header() {
  const isSidebarOpen = useSidebarStore(state => state.isSidebarOpen)
  const toogleSidebar = useSidebarStore(state => state.toggleSidebar)
  const titleRef = useDelayedDisplay<HTMLSpanElement>(isSidebarOpen, 'block')

  return (
    <div className="mt-5 mb-5 flex h-8 flex-shrink-0 items-center justify-between">
      {isSidebarOpen && (
        <span
          ref={titleRef}
          className="font-dongle animate-[fadeInText_300ms_ease-out_50ms_forwards] p-1 text-6xl text-stone-700 uppercase opacity-0"
        >
          TFG
        </span>
      )}
      <button
        className="flex size-9 cursor-pointer items-center justify-center rounded-xl hover:bg-stone-200"
        onClick={toogleSidebar}
      >
        {isSidebarOpen ? hideSidebarIcon : showSidebarIcon}
      </button>
    </div>
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
