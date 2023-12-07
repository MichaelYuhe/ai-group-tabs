import React, { ChangeEvent, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";

export const TYPES = ["Develop", "Entertainment", "Reading", "Social"];

const Popup = () => {
  const [openAIKey, setOpenAIKey] = useState<string>(
    localStorage.getItem("openai_key") || ""
  );

  const updateOpenAIKey = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setOpenAIKey(e.target.value);
  }, []);

  const updateKeyInLocalStorage = useCallback(() => {
    localStorage.setItem("openai_key", openAIKey!);
  }, [openAIKey]);

  const getAllTabsInfo = async () => {
    updateKeyInLocalStorage();
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
    <div className="p-6">
      <div className="relative mb-2">
        <label
          className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900"
          htmlFor="openai-key"
        >
          OpenAI Key
        </label>
        <input
          id="openai-key"
          type="password"
          onChange={updateOpenAIKey}
          value={openAIKey}
          placeholder="Your OpenAI Key"
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
      </div>
      <button
        className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        onClick={getAllTabsInfo}
      >
        Gooooooooooooooo
      </button>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
