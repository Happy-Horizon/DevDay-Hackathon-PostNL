import { Heading, Text, LabelBasic, LabelEmphasis } from "@design-system/react";
import type { CatalogRenderers, PropsOf } from "@copilotkit/a2ui-renderer";
import { ConfirmButton } from "@/components/a2ui/ConfirmButton";
import { RadioButtonGroup } from "@/components/a2ui/RadioButtonGroup";
import type { StampDefinitions } from "./definitions";

export const stampRenderers: CatalogRenderers<StampDefinitions> = {
  TrackingCard: ({ props }: { props: PropsOf<StampDefinitions, "TrackingCard"> }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-2 shadow-sm w-full">
      <div className="flex items-center justify-between gap-2">
        <Heading level={3} size="s">
          Pakketstatus
        </Heading>
        <LabelBasic>{props.status}</LabelBasic>
      </div>
      <Text size="s" variant="subtle">
        Barcode: {props.barcode}
      </Text>
      {props.estimatedDelivery && (
        <Text size="s">
          Verwachte bezorging: <strong>{props.estimatedDelivery}</strong>
        </Text>
      )}
    </div>
  ),

  PriceRow: ({ props }: { props: PropsOf<StampDefinitions, "PriceRow"> }) => (
    <div
      className={[
        "flex items-baseline justify-between gap-4 py-2",
        props.isTotal
          ? "border-t border-gray-200 mt-1 pt-3"
          : "border-b border-gray-100 last:border-b-0",
      ].join(" ")}
    >
      <Text size="s" variant={props.isTotal ? "default" : "subtle"}>
        {props.label}
      </Text>
      <Text size="s">
        {props.isTotal ? <strong>{props.amount}</strong> : props.amount}
      </Text>
    </div>
  ),

  ServiceCard: ({ props }: { props: PropsOf<StampDefinitions, "ServiceCard"> }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-2 shadow-sm w-full">
      <div className="flex items-start justify-between gap-2">
        <Heading level={3} size="s">
          {props.name}
        </Heading>
        {props.badge && <LabelEmphasis>{props.badge}</LabelEmphasis>}
      </div>
      <Text size="s" variant="subtle">
        {props.description}
      </Text>
      <Text size="m">
        <strong>{props.price}</strong>
      </Text>
    </div>
  ),

  RadioButtonGroup: ({
    props,
  }: {
    props: PropsOf<StampDefinitions, "RadioButtonGroup">;
  }) => (
    <RadioButtonGroup
      title={props.title}
      description={props.description}
      options={props.options}
      selectedValue={props.selectedValue}
    />
  ),

  ConfirmButton: ({ props }: { props: PropsOf<StampDefinitions, "ConfirmButton"> }) => (
    <ConfirmButton
      suggestion={props.suggestion}
      title={props.title}
      confirmLabel={props.confirmLabel}
      confirmMessage={props.confirmMessage}
      declineLabel={props.declineLabel}
      declineMessage={props.declineMessage}
      showDecline={props.showDecline}
    />
  ),
};
