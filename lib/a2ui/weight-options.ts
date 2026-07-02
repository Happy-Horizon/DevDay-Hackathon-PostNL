export interface WeightOption {
  value: string;
  label: string;
  suggestions: string[];
}

export const DEFAULT_WEIGHT_OPTIONS: WeightOption[] = [
  {
    value: "0-2",
    label: "Tot 2 kg",
    suggestions: [
      "T-shirt of blouse",
      "Boek of tijdschrift",
      "Smartphone in doos",
      "Sieraden of cosmetica",
      "Klein cadeautje",
    ],
  },
  {
    value: "2-5",
    label: "2 – 5 kg",
    suggestions: [
      "Spijkerbroek met kleding",
      "Koptelefoon in originele verpakking",
      "3–4 studieboeken",
      "Klein schilderij",
      "Kinderpyjama's (meerdere stuks)",
    ],
  },
  {
    value: "5-10",
    label: "5 – 10 kg",
    suggestions: [
      "Winterjas of trui",
      "Laptop met oplader",
      "Krat bier (6 flessen)",
      "Theeglazen of servies",
      "Tweedehands schoenen (2 paar)",
    ],
  },
  {
    value: "10-23",
    label: "10 – 23 kg",
    suggestions: [
      "Elektrische boor of gereedschap",
      "Monitor of kleine TV",
      "Grote kledingpakket",
      "Koffiezetapparaat",
      "Meerdere boeken of vinyl platen",
    ],
  },
];
