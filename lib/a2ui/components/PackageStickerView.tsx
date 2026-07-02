import { Heading, LabelBasic, Text } from "@design-system/react";

export type PackageStickerData = {
  name: string;
  address: string;
  country: string;
  postcode: string;
};

export function PackageStickerView({
  name,
  address,
  country,
  postcode,
}: PackageStickerData) {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border-2 border-[#ff6600] bg-white shadow-md">
      <div className="bg-[#ff6600] px-4 py-2">
        <Heading level={3} size="s" className="text-white">
          PostNL
        </Heading>
        <Text size="s" className="text-white/90">
          Verzendlabel
        </Text>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <LabelBasic>Naar</LabelBasic>
          <Text size="m">
            <strong>{name}</strong>
          </Text>
          <Text size="s">{address}</Text>
          <Text size="s">
            {postcode} · {country}
          </Text>
        </div>
      </div>
    </div>
  );
}
