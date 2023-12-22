import { TabInfo } from "../types";
import Mustache from "mustache";
import { getStorage } from "../utils";
import { DEFAULT_PROMPT } from "../const";

const renderPromptForOpenAI = async (
  tab: TabInfo,
  types: string[]
): Promise<
  [{ role: string; content: string }, { role: string; content: string }]
> => {
  const prompt: string = (await getStorage("prompt")) || DEFAULT_PROMPT;
  return [
    {
      role: "system",
      content: "You are a brwoser tab group classificator",
    },
    {
      role: "user",
      content: Mustache.render(prompt, {
        tabURL: tab.url,
        tabTitle: tab.title,
        types: types.join(", "),
      }),
    },
  ];
};

export const fetchGpt = async (
  apiKey: string,
  tabInfo: TabInfo,
  types: string[]
) => {
  const apiURL =
    (await getStorage("apiURL")) ||
    "https://api.openai.com/v1/chat/completions";

  const model = (await getStorage("model")) || "gpt-3.5-turbo";

  const response = await fetch(apiURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Api-Key": apiKey,
    },
    body: JSON.stringify({
      messages: await renderPromptForOpenAI(tabInfo, types),
      model,
    }),
  });

  const data = await response.json();
  const type: string = data.choices[0].message.content;
  return type;
};
