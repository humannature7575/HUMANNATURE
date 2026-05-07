"use client";

import Link from "next/link";
import { useSocialMedia } from "@/hooks/useSocialMedia";

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

interface SocialIconsProps {
  className?: string;
  iconClassName?: string;
}

export function SocialIcons({ className = "", iconClassName = "w-5 h-5" }: SocialIconsProps) {
  const links = useSocialMedia();

  if (!links) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {links.instagram && (
        <Link
          href={links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Instagram"
        >
          <InstagramIcon className={iconClassName} />
        </Link>
      )}
      {links.facebook && (
        <Link
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Facebook"
        >
          <FacebookIcon className={iconClassName} />
        </Link>
      )}
      {links.tiktok && (
        <Link
          href={links.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/70 hover:text-white transition-colors"
          aria-label="TikTok"
        >
          <TiktokIcon className={iconClassName} />
        </Link>
      )}
    </div>
  );
}
