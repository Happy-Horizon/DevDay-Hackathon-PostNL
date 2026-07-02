"use client";

import { useId, useState } from "react";
import {
  Heading,
  Text,
  RadioButton,
  RadioButtonGroup as StampRadioButtonGroup,
} from "@design-system/react";
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

function getOptionMessage(option: RadioOption): string {
  const parts: string[] = [];

  if (option.description) {
    parts.push(option.description);
  }

  if (option.suggestions?.length) {
    parts.push(`Past bij o.a. ${option.suggestions.slice(0, 3).join(", ")}`);
  }

  return parts.join(" ");
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

      <StampRadioButtonGroup direction="column" gap="m">
        {options.map((option) => {
          const optionMessage = getOptionMessage(option);

          return (
            <RadioButton
              key={option.value}
              id={`${groupId}-${option.value}`}
              name={groupId}
              {...(optionMessage
                ? { label: option.label, message: optionMessage }
                : { message: option.label })}
              checked={activeValue === option.value}
              disabled={isDisabled}
              onChange={() => handleSelect(option)}
            />
          );
        })}
      </StampRadioButtonGroup>
    </div>
  );
}
