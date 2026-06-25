export interface Category {
  id: string;
  label: string;
  prompts: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "kleding-textiel",
    label: "Kleding & textiel",
    prompts: [
      "Een spijkerbroek die ik verkoop op Vinted",
      "Twee t-shirts voor mijn neef in Amsterdam",
      "Een jas die ik terugstuur naar de webshop",
      "Sportkleding, zo'n 5 stuks",
      "Kinderpyjama's voor mijn zus",
      "Een trui, zit al in de originele verpakking",
      "Tweedehands schoenen, maat 42",
      "Een badpak en een handdoek",
    ],
  },
  {
    id: "boeken-papier-media",
    label: "Boeken, papier & media",
    prompts: [
      "Een tweedehands roman, zo'n 300 pagina's",
      "Drie studieboeken voor mijn broer",
      "Een vinyl plaat in de originele hoes",
      "Een tijdschrift abonnement pakket",
    ],
  },
  {
    id: "elektronica-tech",
    label: "Elektronica & tech",
    prompts: [
      "Een smartphone in de doos",
      "Een laptop die ik terugstuur",
      "Koptelefoon in originele verpakking",
      "Kleine accessoires, opladers en kabels",
    ],
  },
  {
    id: "wonen-interieur",
    label: "Wonen & interieur",
    prompts: [
      "Een schilderij, goed verpakt",
      "Kleine decoratieve voorwerpen",
      "Een set theeglazen",
    ],
  },
  {
    id: "cadeaus-feestartikelen",
    label: "Cadeaus & feestartikelen",
    prompts: [
      "Een verjaardagscadeau al ingepakt",
      "Een fles wijn met giftbox",
      "Speelgoed voor een kind",
    ],
  },
  {
    id: "onderdelen-gereedschap",
    label: "Onderdelen & gereedschap",
    prompts: [
      "Kleine machine-onderdelen",
      "Handgereedschap",
      "Elektrische boor",
    ],
  },
  {
    id: "gezondheid-verzorging",
    label: "Gezondheid & persoonlijke verzorging",
    prompts: [
      "Cosmetica in originele verpakking",
      "Supplementen en vitamines",
      "Een medisch apparaatje",
    ],
  },
  {
    id: "voedsel-dranken",
    label: "Voedsel & dranken",
    prompts: [
      "Droge levensmiddelen, goed verpakt",
      "Een krat bier",
      "Koffie en thee pakket",
    ],
  },
];
