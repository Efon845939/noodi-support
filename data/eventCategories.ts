export const EVENT_CATEGORIES = {
  fire: { label: "Yangın", value: "fire" },
  flood: { label: "Sel", value: "flood" },
  earthquake: { label: "Deprem", value: "earthquake" },
  storm: { label: "Fırtına", value: "storm" },
  landslide: { label: "Heyelan", value: "landslide" },
  assault: { label: "Saldırı", value: "assault" },
  robbery: { label: "Hırsızlık", value: "robbery" },
  abduction: { label: "Kayıp", value: "abduction" },
  other: { label: "Diğer", value: "other" },
};

export type EventCategoryType = keyof typeof EVENT_CATEGORIES;

export const EVENT_CATEGORY_LIST: { label: string; value: string }[] =
  Object.values(EVENT_CATEGORIES);
