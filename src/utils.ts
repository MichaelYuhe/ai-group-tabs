export const getValueOrPersistDefault = (defaultValue: any) => (v: any) =>
  v === undefined ? defaultValue : v;

export const DEFAULT_GROUP = [
  "Social",
  "Entertainment",
  "Read Material",
  "Education",
  "Productivity",
  "Utilities",
];
