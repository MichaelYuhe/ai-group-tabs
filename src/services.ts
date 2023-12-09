import { getStorage } from "./utils";

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

  const model = (await getStorage("model")) || "gpt-4";
  const apiURL = (await getStorage("apiURL")) || "https://api.openai.com";

  try {
    await Promise.all(
      tabInfoList.map(async (tab) => {
        if (!tab.url) return;
        const response = await fetch(`${apiURL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAIKey}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: `Please analyze the given URL and classify the browser tab type as one of the following: "${types.join(
                  ", "
                )}". Respond with the type classification only without any comments.`,
              },
              {
                role: "user",
                content: `The site url is ${tab.url}`,
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
    const model = (await getStorage("model")) || "gpt-4";
    const apiURL = (await getStorage("apiURL")) || "https://api.openai.com";

    const response = await fetch(`${apiURL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Please analyze the given URL and classify the browser tab type as one of the following: "${types.join(
              ", "
            )}". Respond with the type classification only without any comments.`,
          },
          {
            role: "user",
            content: `The tab url is ${tab.url}`,
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
