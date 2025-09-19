interface SendMessageButtonProps {
  disabled: boolean,
  onClick: () => Promise<void>

}
export default function SendMessageButton({ disabled, onClick }: SendMessageButtonProps) {
  return <button
    className="cursor-pointer rounded-4xl p-1.5 text-stone-900 hover:bg-stone-400 disabled:opacity-50"
    onClick={onClick}
    disabled={disabled}
  >
    {sendMessageImage}
  </button>
}

const sendMessageImage = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon icon-tabler icons-tabler-outline icon-tabler-send-2"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124z" />
    <path d="M6.5 12h14.5" />
  </svg>
)
