import { useEffect, useRef } from 'react'

import { useStore } from '../../store/store'

export default function Header() {
  const isSideBarOpen = useStore(state => state.isSideBarOpen)
  const toogleSideBar = useStore(state => state.toogleSideBar)
  const titleRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (isSideBarOpen && titleRef.current) {
      // Initially hide the element completely (no layout impact)
      titleRef.current.style.display = 'none'

      // After a delay, show it and start the animation
      const timer = setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.style.display = 'block'
        }
      }, 100) // Delay of 100ms

      return () => clearTimeout(timer)
    }
  }, [isSideBarOpen])

  return (
    <div className="mt-5 mb-5 flex h-8 flex-shrink-0 items-center justify-between">
      {isSideBarOpen && (
        <span
          ref={titleRef}
          className="font-dongle animate-[fadeInText_300ms_ease-out_50ms_forwards] p-1 text-6xl text-stone-700 uppercase opacity-0"
        >
          TFG
        </span>
      )}
      <button
        className="flex size-9 cursor-pointer items-center justify-center rounded-xl hover:bg-stone-200"
        onClick={toogleSideBar}
      >
        {isSideBarOpen ? hideSidebarIcon : showSidebarIcon}
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
