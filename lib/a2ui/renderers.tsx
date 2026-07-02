import { Heading, Text, LabelEmphasis } from "@design-system/react";
import type { CatalogRenderers, PropsOf } from "@copilotkit/a2ui-renderer";
import type { StampDefinitions } from "./definitions";

export const stampRenderers: CatalogRenderers<StampDefinitions> = {
  ProductCard: ({ props }: { props: PropsOf<StampDefinitions, "ProductCard"> }) => (
    <div className="rounded-xl border border-[#bec0cb] bg-white p-4 flex flex-col gap-2 shadow-sm w-full">
      <div className="flex items-start justify-between gap-2">
        <Heading level={3} size="s">
          {props.index ? `${props.index}. ` : ""}
          {props.name}
        </Heading>
        <Text size="m">
          <strong>{props.price}</strong>
        </Text>
      </div>
      <Text size="s" variant="subtle">
        SKU: {props.sku}
      </Text>
      {props.note && (
        <Text size="s" variant="subtle">
          {props.note}
        </Text>
      )}
    </div>
  ),

  OrderSummary: ({ props }: { props: PropsOf<StampDefinitions, "OrderSummary"> }) => (
    <div className="rounded-xl border border-[#6161ff]/30 bg-[#f8f8ff] p-5 flex flex-col gap-3 w-full">
      <Heading level={3} size="s">
        Ordersamenvatting
      </Heading>
      <div className="flex flex-col gap-1">
        <Text size="s">
          <strong>{props.quantity}×</strong> {props.productName}
        </Text>
        <Text size="s" variant="subtle">
          SKU: {props.sku}
        </Text>
      </div>
      <div className="border-t border-[#bec0cb]/50 pt-3 flex flex-col gap-1">
        <Text size="s">
          Bezorgadres: {props.deliveryAddress}
        </Text>
        {props.deliveryService && (
          <Text size="s" variant="subtle">
            Verzending: {props.deliveryService}
          </Text>
        )}
        {props.deliveryDate && (
          <Text size="s" variant="subtle">
            Verwacht: {props.deliveryDate}
          </Text>
        )}
      </div>
      <div className="border-t border-[#bec0cb] pt-3">
        <Text size="m">
          Totaal: <strong>{props.subtotal}</strong>
        </Text>
      </div>
      <Text size="s" variant="subtle">
        Bevestig met &quot;ja&quot; of &quot;akkoord&quot; om door te gaan naar PostNL Checkout.
      </Text>
    </div>
  ),

  CheckoutHandoff: ({ props }: { props: PropsOf<StampDefinitions, "CheckoutHandoff"> }) => (
    <div className="rounded-xl border border-green-300 bg-green-50 p-5 flex flex-col gap-3 w-full">
      <Heading level={3} size="s" className="text-green-900">
        PostNL Checkout
      </Heading>
      <Text size="s">
        {props.message ??
          "Open de link hieronder in de PostNL-app om je bestelling af te ronden en te betalen."}
      </Text>
      <div className="flex flex-col gap-1">
        <Text size="s" variant="subtle">
          Ordernummer
        </Text>
        <Text size="m">
          <strong>{props.orderId}</strong>
        </Text>
      </div>
      <a
        href={props.checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-lg bg-[#6161ff] px-4 py-3 text-white text-sm font-medium hover:bg-[#4e4ee2] transition-colors"
      >
        Afrekenen in PostNL-app →
      </a>
      <Text size="s" variant="subtle">
        {props.checkoutUrl}
      </Text>
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
};
