import Mustache from "mustache";
import { DEFAULT_PROMPT, getStorage } from "./utils";

interface TabGroup {
  type: string;
  tabIds: (number | undefined)[];
}

interface TabInfo {
  id: number | undefined;
  title: string | undefined;
  url: string | undefined;
}

const renderPrompt = async (tab: TabInfo, types: string[]): Promise<string> => {
  const prompt: string = (await getStorage("prompt")) || DEFAULT_PROMPT;
  return Mustache.render(prompt, {
    tabURL: tab.url,
    tabTitle: tab.title,
    types: types.join(", "),
  });
};

export async function batchGroupTabs(
  tabs: chrome.tabs.Tab[],
  types: string[],
  openAIKey: string
) {
  const tabInfoList: TabInfo[] = tabs.map((tab) => {
    return {
      id: tab.id,
      title: tab.title,
      url: tab.url,
    };
  });

  const result: TabGroup[] = types.map((type) => {
    return {
      type,
      tabIds: [],
    };
  });

  const model = (await getStorage("model")) || "gpt-3.5-turbo";
  const apiURL =
    (await getStorage("apiURL")) ||
    "https://api.openai.com/v1/chat/completions";

  try {
    await Promise.all(
      tabInfoList.map(async (tabInfo) => {
        if (!tabInfo.url) return;
        const response = await fetch(apiURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAIKey}`,
            "Api-Key": openAIKey,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: "You are a classificator",
              },
              {
                role: "user",
                content: await renderPrompt(tabInfo, types),
              },
            ],
            model,
          }),
        });

        const data = await response.json();
        const type = data.choices[0].message.content;

        const index = types.indexOf(type);
        if (index === -1) return;
        result[index].tabIds.push(tabInfo.id);
      })
    );
    return result;
  } catch (error) {
    console.error(error);
    return result;
  }
}

export async function handleOneTab(
  tab: chrome.tabs.Tab,
  types: string[],
  openAIKey: string
) {
  try {
    const tabInfo: TabInfo = { id: tab.id, title: tab.title, url: tab.url };
    const model = (await getStorage("model")) || "gpt-3.5-turbo";
    const apiURL =
      (await getStorage("apiURL")) ||
      "https://api.openai.com/v1/chat/completions";

    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
        "Api-Key": openAIKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a classificator",
          },
          {
            role: "user",
            content: await renderPrompt(tabInfo, types),
          },
        ],
        model,
      }),
    });

    const data = await response.json();
    const type = data.choices[0].message.content;

    return type;
  } catch (error) {
    console.error(error);
  }
}
