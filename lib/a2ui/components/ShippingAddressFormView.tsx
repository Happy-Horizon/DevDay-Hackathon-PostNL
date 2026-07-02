"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Fieldset,
  Flex,
  Form,
  FormField,
  FormFieldLabel,
  Heading,
  LabelBasic,
  LabelEmphasis,
  SelectInput,
  Text,
  TextInput,
} from "@design-system/react";
import { PackageStickerView } from "./PackageStickerView";

const COUNTRIES = [
  { value: "Nederland", label: "Nederland" },
  { value: "België", label: "België" },
  { value: "Duitsland", label: "Duitsland" },
  { value: "Frankrijk", label: "Frankrijk" },
  { value: "Verenigd Koninkrijk", label: "Verenigd Koninkrijk" },
  { value: "Overig", label: "Overig" },
];

type FormState = {
  name: string;
  address: string;
  country: string;
  postcode: string;
};

type ShippingAddressFormViewProps = {
  country?: string;
};

export function ShippingAddressFormView({ country: knownCountry }: ShippingAddressFormViewProps) {
  const [formData, setFormData] = useState<FormState>({
    name: "",
    address: "",
    country: knownCountry ?? "",
    postcode: "",
  });
  const [sticker, setSticker] = useState<FormState | null>(null);

  const showCountryField = !knownCountry;

  function updateField(field: keyof FormState, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const country = knownCountry ?? formData.country;
    if (!formData.name.trim() || !formData.address.trim() || !formData.postcode.trim() || !country.trim()) {
      return;
    }

    setSticker({
      name: formData.name.trim(),
      address: formData.address.trim(),
      country: country.trim(),
      postcode: formData.postcode.trim(),
    });
  }

  if (sticker) {
    return (
      <Card
        theme="default"
        size="full"
        header={
          <Text size="s" variant="subtle">
            Verzendlabel aangemaakt voor:
          </Text>
        }
        body={<PackageStickerView {...sticker} />}
      />
    );
  }

  return (
    <Card
      theme="default"
      size="full"
      header={
        <Flex direction="column">
          <LabelEmphasis>Verzending</LabelEmphasis>
          <Heading level={3} size="s">
            Bezorgadres
          </Heading>
          <Text size="s" variant="subtle">
            Vul het adres in waar het pakket naartoe moet.
          </Text>
        </Flex>
      }
      body={
        <Form onSubmit={handleSubmit}>
          <Fieldset>
            <FormField direction="column">
              <FormFieldLabel htmlFor="shipping-name">Naam</FormFieldLabel>
              <TextInput
                id="shipping-name"
                name="name"
                size="full"
                value={formData.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Naam ontvanger"
                required
              />
            </FormField>

            <FormField direction="column">
              <FormFieldLabel htmlFor="shipping-address">Adres</FormFieldLabel>
              <TextInput
                id="shipping-address"
                name="address"
                size="full"
                value={formData.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Straat en huisnummer"
                required
              />
            </FormField>

            {showCountryField ? (
              <FormField direction="column">
                <FormFieldLabel htmlFor="shipping-country">Land</FormFieldLabel>
                <SelectInput
                  id="shipping-country"
                  name="country"
                  size="full"
                  value={formData.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Selecteer een land"
                  required
                >
                  <option value="" disabled>
                    Selecteer een land
                  </option>
                  {COUNTRIES.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
            ) : (
              <FormField direction="column">
                <FormFieldLabel>Land</FormFieldLabel>
                <Flex alignItems="center">
                  <LabelBasic>{knownCountry}</LabelBasic>
                </Flex>
              </FormField>
            )}

            <FormField direction="column">
              <FormFieldLabel htmlFor="shipping-postcode">Postcode</FormFieldLabel>
              <TextInput
                id="shipping-postcode"
                name="postcode"
                size="full"
                value={formData.postcode}
                onChange={(event) => updateField("postcode", event.target.value)}
                placeholder="1234 AB"
                required
              />
            </FormField>

            <Button type="submit" variant="primary">
              Verzendlabel maken
            </Button>
          </Fieldset>
        </Form>
      }
    />
  );
}
