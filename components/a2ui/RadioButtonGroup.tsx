"use client";

import { useId, useState } from "react";
import { Heading, Text } from "@design-system/react";
import { useAgentReply } from "@/lib/a2ui/use-agent-reply";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  suggestions?: string[];
  replyMessage: string;
}

export interface RadioButtonGroupProps {
  title: string;
  description?: string;
  options: RadioOption[];
  selectedValue?: string;
}

export function RadioButtonGroup({
  title,
  description,
  options,
  selectedValue,
}: RadioButtonGroupProps) {
  const groupId = useId();
  const { sendReply, isDisabled } = useAgentReply();

  const defaultValue =
    selectedValue && options.some((option) => option.value === selectedValue)
      ? selectedValue
      : undefined;

  const [activeValue, setActiveValue] = useState(defaultValue ?? "");

  function handleSelect(option: RadioOption) {
    if (isDisabled) return;

    setActiveValue(option.value);
    sendReply(option.replyMessage);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-4 shadow-sm w-full">
      <Heading level={3} size="s">
        {title}
      </Heading>
      {description && (
        <Text size="s" variant="subtle">
          {description}
        </Text>
      )}

      <div
        className="flex flex-col gap-3 w-full"
        role="radiogroup"
        aria-label={title}
      >
        {options.map((option) => {
          const isSelected = activeValue === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              id={`${groupId}-${option.value}`}
              disabled={isDisabled}
              onClick={() => handleSelect(option)}
              className={[
                "w-full rounded-xl border p-4 flex flex-col gap-2 text-left transition-colors",
                isDisabled && !isSelected
                  ? "opacity-50 cursor-not-allowed"
                  : "",
                isSelected
                  ? "border-[#6161ff] bg-[#f5f5ff] shadow-sm ring-2 ring-[#6161ff]/20"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <Text size="m">
                  <strong>{option.label}</strong>
                </Text>
                <span
                  aria-hidden="true"
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    isSelected
                      ? "border-[#6161ff] bg-[#6161ff]"
                      : "border-gray-300 bg-white",
                  ].join(" ")}
                >
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </span>
              </div>
              {option.description && (
                <Text size="s" variant="subtle">
                  {option.description}
                </Text>
              )}
              {option.suggestions && option.suggestions.length > 0 && (
                <Text size="s" variant="subtle">
                  Past bij o.a. {option.suggestions.slice(0, 3).join(", ")}
                </Text>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
