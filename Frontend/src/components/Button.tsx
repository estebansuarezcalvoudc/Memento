import type { ReactNode } from "react";

export default function Button({ children }: { children: ReactNode }) {
  function handleClick() {
    console.log("my meetings clicked");
  }

  return (
    <div className="flex justify-center items-center">
      <button
        onClick={handleClick}
        className="bg-blue-400 rounded-xl text-2xl px-3 py-2 hover:bg-blue-500"
      >
        {children}
      </button>
    </div>
  );
}
