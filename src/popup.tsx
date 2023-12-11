import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { batchGroupTabs } from "./services";
import { DEFAULT_GROUP, getStorage, setStorage } from "./utils";

import "./popup.css";
import Input from "./components/Input";

const Popup = () => {
  const [openAIKey, setOpenAIKey] = useState<string | undefined>("");
  const [types, setTypes] = useState<string[]>([]);
  const [isOn, setIsOn] = useState<boolean | undefined>(true);
  const [newType, setNewType] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    getStorage<string>("openai_key").then(setOpenAIKey);
    getStorage<boolean>("isOn").then(setIsOn);
    getStorage<string[]>("types").then((types) => {
      if (!types) {
        setTypes(DEFAULT_GROUP);
        setStorage<string[]>("types", DEFAULT_GROUP);
        return;
      }
      setTypes(types);
    });
  }, []);

  const updateOpenAIKey = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setOpenAIKey(e.target.value);
  }, []);

  const updateKeyInStorage = useCallback(() => {
    setStorage("openai_key", openAIKey);
  }, [openAIKey]);

  const getAllTabsInfo = async () => {
    if (!openAIKey || !types || !types.length) {
      return;
    }
    try {
      setIsLoading(true);
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const result = await batchGroupTabs(tabs, types, openAIKey);
      chrome.runtime.sendMessage({ result });
    } catch (error) {
      // TODO show error message
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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

        <Input
          id="openai-key"
          type="password"
          onChange={updateOpenAIKey}
          onBlur={updateKeyInStorage}
          value={openAIKey}
          placeholder="Your OpenAI Key"
        />
      </div>

      {!openAIKey?.length && (
        <div className="text-sm text-gray-500 mb-2">
          You can get your key from{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="text-primary/lg underline underline-offset-2 hover:text-primary"
          >
            here
          </a>
        </div>
      )}

      <div className="flex flex-col gap-y-2 mb-2">
        <form
          onSubmit={(e) => {
            if (!newType) {
              return;
            }
            const newTypes = [...types, newType];
            setNewType("");
            setTypes(newTypes);
            e.preventDefault();

            setStorage<string[]>("types", newTypes);
          }}
        >
          <div className="flex items-center gap-x-2">
            <Input
              type="text"
              value={newType}
              placeholder="Group Type"
              onChange={(e) => {
                setNewType(e.target.value);
              }}
            />

            <button
              className="rounded-md w-fit bg-primary/lg px-2.5 py-1.5 text-sm font-semibold 
            text-white shadow-sm hover:bg-primary focus-visible:outline focus-visible:outline-2 
            focus-visible:outline-offset-2"
            >
              Add
            </button>
          </div>
        </form>

        {types?.map((type, idx) => (
          <div className="flex items-center gap-x-2" key={idx}>
            <Input
              placeholder="Group Type"
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
                setStorage<string[]>("types", newTypes);
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <button
        disabled={!openAIKey || !types || !types.length}
        className="inline-flex items-center rounded-md bg-primary/lg px-2.5 py-1.5 text-sm font-semibold 
        text-white shadow-sm hover:bg-primary focus-visible:outline cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={getAllTabsInfo}
      >
        {isLoading ? <LoadingSpinner /> : null}
        Group Existing Tabs
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
          <div className="peer h-6 w-11 rounded-full border bg-slate-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-green-300"></div>
        </label>
        <span className="ml-3 text-gray-900 text-sm">
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
