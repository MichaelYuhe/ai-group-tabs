import React from "react";
import { createRoot } from "react-dom/client";

export const TYPES = ["Develop", "Entertainment", "Reading", "Social"];

const Popup = () => {
  const OPENAI_API_KEY = "Your key";

  const getAllTabsInfo = async () => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabsInfo = tabs.map((tab) => {
      return {
        id: tab.id,
        title: tab.title,
        url: tab.url,
      };
    });

    const result: any[] = TYPES.map((type) => {
      return {
        type,
        tabIds: [],
      };
    });

    await Promise.all(
      tabsInfo.map(async (tab) => {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
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
              model: "gpt-4",
            }),
          }
        );

        const data = await response.json();
        const type = data.choices[0].message.content;

        const index = TYPES.indexOf(type);
        if (index === -1) return;
        result[index].tabIds.push(tab.id);
      })
    );

    chrome.runtime.sendMessage({ result });
  };

  return (
    <>
      <button onClick={getAllTabsInfo}>Gooooooooooooooo</button>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
