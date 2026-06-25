"use client";

import { KeyboardEvent } from "react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = "Beschrijf wat je wilt versturen in 1 of 2 zinnen...",
  autoFocus = false,
}: ChatComposerProps) {
  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const hasText = value.trim().length > 0;

  return (
    <div
      className={[
        "flex items-center gap-2 px-4 py-3 rounded-xl border bg-white transition-colors",
        hasText
          ? "border-blue-700 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"
          : "border-gray-300",
      ].join(" ")}
    >
      <button
        type="button"
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Bijlage toevoegen"
        tabIndex={-1}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
          <path
            d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-base"
        aria-label="Verstuur bericht"
        disabled={isLoading}
      />

      <button
        type="button"
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Spreek in"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
          <path
            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 10v2a7 7 0 0 1-14 0v-2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="12"
            y1="19"
            x2="12"
            y2="23"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="23"
            x2="16"
            y2="23"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {(hasText || isLoading) && (
        <button
          type="button"
          onClick={isLoading ? undefined : handleSubmit}
          disabled={isLoading && !hasText}
          className={[
            "shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
            isLoading
              ? "bg-blue-700 cursor-default"
              : "bg-blue-700 hover:bg-blue-800 cursor-pointer",
          ].join(" ")}
          aria-label={isLoading ? "Stoppen" : "Verzenden"}
        >
          {isLoading ? (
            <svg viewBox="0 0 16 16" className="w-4 h-4 text-white" fill="currentColor" aria-hidden="true">
              <rect x="4" y="4" width="8" height="8" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="w-4 h-4 text-white" fill="none" aria-hidden="true">
              <path
                d="M8 12V4M4 8l4-4 4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
