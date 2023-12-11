import { Storage } from "@plasmohq/storage";

interface TabGroup {
  type: string;
  tabIds: (number | undefined)[];
}

export async function batchGroupTabs(
  tabs: chrome.tabs.Tab[],
  types: string[],
  openAIKey: string
) {
  const tabInfoList = tabs.map((tab) => {
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

  const storage = new Storage();

  const model: string = (await storage.get<string>("model")) || "gpt-3.5-turbo";
  const apiURL: string =
    (await storage.get<string>("apiURL")) ||
    "https://api.openai.com/v1/chat/completions";

  try {
    await Promise.all(
      tabInfoList.map(async (tab) => {
        if (!tab.url) return;
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
                content: `Based on the URL: "${tab.url}" and title: "${
                  tab.title
                }", classify the browser tab type as one of the following: ${types.join(
                  ", "
                )}. Respond with only the classification keyword from the list.`,
              },
            ],
            model,
          }),
        });

        const data = await response.json();
        const type = data.choices[0].message.content;

        const index = types.indexOf(type);
        if (index === -1) return;
        result[index].tabIds.push(tab.id);
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
    const storage = new Storage();
    const model: string =
      (await storage.get<string>("model")) || "gpt-3.5-turbo";
    const apiURL: string =
      (await storage.get<string>("apiURL")) ||
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
            content: `Based on the URL: "${tab.url}" and title: "${
              tab.title
            }", classify the browser tab type as one of the following: ${types.join(
              ", "
            )}. Respond with only the classification keyword from the list.`,
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
