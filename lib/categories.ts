export interface Category {
  id: string;
  label: string;
  prompts: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "cadeaus",
    label: "Cadeaus",
    prompts: [
      "Ik zoek een verjaardagscadeau voor mijn moeder, budget rond de €40",
      "Een leuk cadeau voor een collega die gaat trouwen",
      "Iets kleins en persoonlijk onder de €25",
      "Cadeau voor mijn vader die van lezen houdt",
    ],
  },
  {
    id: "wonen",
    label: "Wonen & interieur",
    prompts: [
      "Ik wil kaarsen of geur voor thuis, budget €30",
      "Iets voor op de koffietafel",
      "Decoratie voor een nieuw appartement",
    ],
  },
  {
    id: "sport",
    label: "Sport & yoga",
    prompts: [
      "Yoga-accessoires, budget rond de €35",
      "Iets voor thuis sporten",
      "Een cadeau voor iemand die begint met yoga",
    ],
  },
  {
    id: "kinderen",
    label: "Kinderen",
    prompts: [
      "Speelgoed of knutselspullen voor een kind van 7",
      "Cadeau voor mijn nichtje, budget €20",
      "Iets educatiefs en leuk",
    ],
  },
  {
    id: "beauty",
    label: "Beauty & verzorging",
    prompts: [
      "Verzorgingsproducten als cadeau, budget €25",
      "Iets luxe voor een vriendin",
      "Handverzorging of wellness",
    ],
  },
  {
    id: "boeken",
    label: "Boeken & media",
    prompts: [
      "Een boek als cadeau, iets populairs",
      "Cadeau voor een fan van koken",
      "Iets onder de €15",
    ],
  },
];
