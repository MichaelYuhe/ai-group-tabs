export const DEFAULT_PROMPT: string =
  `Classify the tab group base on the provided URL ({{tabURL}}) and title ({{tabTitle}}) into one of the categories: ` +
  `{{types}}. Response with the category only, without any comments.`;

export const DEFAULT_GROUP = [
  "Social",
  "Entertainment",
  "Read Material",
  "Education",
  "Productivity",
  "Utilities",
];

export enum Color {
  grey = "grey",
  blue = "blue",
  red = "red",
  yellow = "yellow",
  green = "green",
  pink = "pink",
  purple = "purple",
  cyan = "cyan",
  orange = "orange",
}

export const TabColorConfig = [
  {
    name: Color.grey,
    value: "rgb(218, 220, 224)",
  },
  {
    name: Color.blue,
    value: "rgb(147, 179, 242)",
  },
  {
    name: Color.red,
    value: "rgb(228, 144, 134)",
  },
  {
    name: Color.yellow,
    value: "rgb(247, 215, 117)",
  },
  {
    name: Color.green,
    value: "rgb(145, 199, 153)",
  },
  {
    name: Color.pink,
    value: "rgb(240, 145, 200)",
  },
  {
    name: Color.purple,
    value: "rgb(188, 140, 242)",
  },
  {
    name: Color.cyan,
    value: "rgb(144, 215, 233)",
  },
  {
    name: Color.orange,
    value: "rgb(240, 176, 122)",
  },
] as const;
