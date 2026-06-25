"use client";

import { CATEGORIES } from "@/lib/categories";

interface CategoryPromptsProps {
  categoryId: string;
  onBack: () => void;
  onSelect: (prompt: string) => void;
}

export function CategoryPrompts({
  categoryId,
  onBack,
  onSelect,
}: CategoryPromptsProps) {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return null;

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 font-medium"
          aria-label="Terug naar categorieën"
        >
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 4L6 8l4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Terug
        </button>
        <span className="text-base font-bold text-gray-900">
          {category.label}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {category.prompts.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => onSelect(prompt)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors text-sm text-blue-700 text-left group"
            >
              <span>{prompt}</span>
              <svg
                viewBox="0 0 16 16"
                className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
