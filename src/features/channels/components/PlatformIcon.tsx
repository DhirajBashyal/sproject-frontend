import { cn } from "@/lib/utils";
import type { Platform } from "../types";

/** WhatsApp has no comments, so its bot only answers messages. */
export function autoReplyLabel(platform: Platform, chatbotId: string | null) {
  if (!chatbotId) return "Auto-replies off";
  return platform === "whatsapp" ? "AI replies to messages" : "AI replies to messages and comments";
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  facebook: "Messenger",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
};

const glyphs: Record<Platform, React.ReactNode> = {
  instagram: (
    <>
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3.500" y="3.500" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
      </g>
      <circle cx="17" cy="7" r="1.200" fill="currentColor" />
    </>
  ),
  facebook: (
    <path
      fill="currentColor"
      d="M12 2.500C6.500 2.500 2.500 6.500 2.500 11.700c0 2.800 1.200 5.200 3.100 6.800V22l3.300-1.800c1 .3 2 .4 3.100.4 5.500 0 9.500-4 9.500-8.900s-4-9.200-9.500-9.200zm1 12l-2.500-2.600-4.800 2.600 5.300-5.600 2.600 2.600 4.700-2.600-5.300 5.600z"
    />
  ),
  whatsapp: (
    <>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        d="M12 3a9 9 0 00-7.700 13.600L3 21l4.500-1.200A9 9 0 1012 3z"
      />
      <path
        fill="currentColor"
        d="M8.700 7.500c.3 0 .6 0 .8.500l.7 1.700c.1.300 0 .500-.1.700l-.6.700c.7 1.300 1.800 2.300 3.200 3l.8-.9c.2-.2.400-.3.700-.2l1.700.8c.3.100.5.300.4.700-.2 1.200-1.200 2-2.300 2-3.400-.1-7-3.700-7.100-7 0-1 .6-2 1.800-2z"
      />
    </>
  ),
};

const backgrounds: Record<Platform, string> = {
  instagram: "bg-[#ee0a6f]",
  facebook: "bg-gradient-to-tr from-[#0a5fa8] via-[#1f7bf2] to-[#38bdf8]",
  whatsapp: "bg-[#1ed760]",
};

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <span className={cn("grid place-items-center text-white", backgrounds[platform], className)}>
      <svg viewBox="0 0 24 24" className="size-[60%]" aria-hidden="true">
        {glyphs[platform]}
      </svg>
    </span>
  );
}
