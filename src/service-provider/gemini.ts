import { TabInfo } from "../types";
import Mustache from "mustache";
import { getStorage } from "../utils";
import { DEFAULT_PROMPT } from "../const";

const renderPromptForGemini = async (
  tab: TabInfo,
  types: string[]
): Promise<{ role: string; parts: [{ text: string }] }[]> => {
  const prompt: string = (await getStorage("prompt")) || DEFAULT_PROMPT;
  return [
    {
      role: "user",
      parts: [
        {
          text: "",
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: "You are a brwoser tab group classificator",
        },
      ],
    },
    {
      role: "user",
      parts: [
        {
          text: Mustache.render(prompt, {
            tabURL: tab.url,
            tabTitle: tab.title,
            types: types.join(", "),
          }),
        },
      ],
    },
  ];
};

export const fetchGemini = async (
  apiKey: string,
  tabInfo: TabInfo,
  types: string[]
) => {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
      apiKey,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: await renderPromptForGemini(tabInfo, types),
      }),
    }
  );

  const data = await response.json();

  const type: string = data.candidates[0].content.parts[0].text;
  return type;
};
