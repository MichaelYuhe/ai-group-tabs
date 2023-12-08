import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { batchGroupTabs } from "./services";
import { getStorage, setStorage } from "./utils";
import "./popup.css";

const Popup = () => {
  const [openAIKey, setOpenAIKey] = useState<string>("");
  const [types, setTypes] = useState<string[]>([]);
  const [isOn, setIsOn] = useState<boolean>(true);

  useEffect(() => {
    getStorage<string>("openai_key").then(setOpenAIKey);
    chrome.storage.local.get("types", (result) => {
      if (result?.types) {
        setTypes(result.types);
      }
    });
  }, []);

  const updateOpenAIKey = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setOpenAIKey(e.target.value);
  }, []);

  const updateKeyInStorage = useCallback(() => {
    setStorage("openai_key", openAIKey);
  }, [openAIKey]);

  const getAllTabsInfo = async () => {
    console.log(openAIKey, types);
    if (!openAIKey || !types || !types.length) {
      return;
    }

    updateKeyInStorage();
    const tabs = await chrome.tabs.query({ currentWindow: true });

    const result = await batchGroupTabs(tabs, types, openAIKey);

    chrome.runtime.sendMessage({ result });
  };

  const disableGrouping = () => {
    setIsOn((isOn) => {
      setStorage("isOn", !isOn);
      return !isOn;
    });
  };

  return (
    <div className="p-6 min-w-[24rem]">
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

      <div className="flex flex-col gap-y-2 mb-2">
        {types?.map((type, idx) => (
          <div className="flex items-center gap-x-2" key={idx}>
            <input
              placeholder="Group Type"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={type}
              onChange={(e) => {
                const newTypes = [...types];
                newTypes[idx] = e.target.value;
                setTypes(newTypes);
              }}
            />

            <button
              onClick={() => {
                const newTypes = [...types];
                newTypes.splice(idx, 1);
                setTypes(newTypes);
              }}
            >
              Delete
            </button>
          </div>
        ))}

        <button
          onClick={() => {
            setTypes([...types, ""]);
          }}
          className="rounded-md w-fit bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Add New Group Type
        </button>

        <button
          onClick={() => {
            chrome.storage.local.set({ types });

            chrome.runtime.sendMessage({ types });
          }}
          className="rounded-md w-fit bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Save Group Types
        </button>
      </div>

      <button
        disabled={!openAIKey || !types || !types.length}
        className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        onClick={getAllTabsInfo}
      >
        Group Tabs
      </button>

      <div className="flex items-center mt-2">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            id="switch"
            type="checkbox"
            checked={isOn}
            className="peer sr-only"
            onClick={disableGrouping}
          />
          <label htmlFor="switch" className="hidden"></label>
          <div className="peer h-6 w-11 rounded-full border bg-slate-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-green-300"></div>
        </label>
        <span className="ml-3 text-gray-600 text-sm font-light">
          Allow automatic grouping
        </span>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
