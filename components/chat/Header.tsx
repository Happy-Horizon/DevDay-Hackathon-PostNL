"use client";

import Image from "next/image";

interface HeaderProps {
  onCancel?: () => void;
}

export function Header({ onCancel }: HeaderProps) {
  return (
    <header className="bg-[#f1f1f2] flex flex-col items-center overflow-hidden px-10 shrink-0 w-full">
      <div className="flex items-center justify-between max-w-[1104px] overflow-hidden py-3 w-full">
        {/* Logo */}
        <div className="relative shrink-0 w-14 h-14">
          <Image
            src="/postnl-logo.svg"
            alt="PostNL"
            width={56}
            height={56}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-14 py-4">
          {/* Language + Login */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex items-center gap-1 text-[#4e4ee2] text-base leading-6 border-r border-[#bec0cb] pr-4"
            >
              NL
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
                <path
                  d="M3.9 5.5L8 9.5l4.1-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="flex items-center gap-1 text-[#4e4ee2] text-base leading-6"
            >
              Inloggen
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
                <path
                  d="M3.9 5.5L8 9.5l4.1-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Cancel */}
          {onCancel && (
            <button
              type="button"
              className="flex items-center gap-1 text-[#4e4ee2] text-base leading-6"
              onClick={onCancel}
            >
              Annuleren
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
