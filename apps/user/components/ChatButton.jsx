"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChatButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/chatme")}
      className="
        fixed
        bottom-6
        right-6
        w-14
        h-14
        rounded-full
        bg-orange-500
        hover:bg-orange-600
        text-white
        flex
        items-center
        justify-center
        shadow-xl
        shadow-orange-500/30
        transition
        duration-300
        hover:scale-110
        active:scale-95
        z-[999]
      "
      aria-label="Open chat"
      title="Chat"
      type="button"
    >
      <MessageCircle size={24} />
    </button>
  );
}