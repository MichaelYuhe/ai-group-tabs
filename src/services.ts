import { TYPES } from "./background";

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

  try {
    await Promise.all(
      tabInfoList.map(async (tab) => {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openAIKey}`,
            },
            body: JSON.stringify({
              messages: [
                {
                  role: "system",
                  content: `You are an assistant to help decide a type in ${types.join(
                    ", "
                  )} for a tab by search and analyze its url. Response the type only. Do not return anything else.`,
                },
                {
                  role: "user",
                  content: `The site url is ${tab.url}`,
                },
              ],
              model: "gpt-3.5-turbo",
            }),
          }
        );

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

export async function handleOneTab(tab: chrome.tabs.Tab, openAIKey: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are an assistant to help decide a type in ${TYPES.join(
              ", "
            )} for a tab by search and analyze its url. Response the type only. Do not return anything else.`,
          },
          {
            role: "user",
            content: `The site url is ${tab.url}`,
          },
        ],
        model: "gpt-3.5-turbo",
      }),
    });

    const data = await response.json();
    const type = data.choices[0].message.content;

    return type;
  } catch (error) {
    console.log(error);
  }
}
