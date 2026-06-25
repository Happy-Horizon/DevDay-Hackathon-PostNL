"use client";

import { CATEGORIES } from "@/lib/categories";

interface CategoryGridProps {
  onSelect: (categoryId: string) => void;
}

export function CategoryGrid({ onSelect }: CategoryGridProps) {
  return (
    <section className="mt-8">
      <p className="text-base font-semibold text-gray-800 mb-3">
        Of kies direct een categorie
      </p>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((cat) => (
          <CategoryButton
            key={cat.id}
            label={cat.label}
            onClick={() => onSelect(cat.id)}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors text-sm font-medium text-blue-700 text-left group"
    >
      <span>{label}</span>
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
  );
}
