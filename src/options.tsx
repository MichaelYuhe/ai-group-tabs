import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./options.css";
import { DEFAULT_PROMPT, getStorage, setStorage } from "./utils";
import FilterRules from "./components/FilterRules";
import { FilterRuleItem } from "./types";

const Options = () => {
  const [model, setModel] = useState<string | undefined>("gpt-3.5-turbo");
  const [apiURL, setApiURL] = useState<string | undefined>(
    "https://api.openai.com/v1/chat/completions"
  );
  const [prompt, setPrompt] = useState<string | undefined>(DEFAULT_PROMPT);
  const [isPromptValid, setIsPromptValid] = useState<boolean>(true);
  const [filterRules, setFilterRules] = useState<FilterRuleItem[] | undefined>([
    { id: 0, type: "DOMAIN", rule: "" },
  ]);
  const promptFormatWarning: string = `{{tabURL}}, {{tabTitle}} and {{types}} must be in the prompt`;

  useEffect(() => {
    getStorage<string>("model").then(setModel);
    getStorage<string>("apiURL").then(setApiURL);
    getStorage<string>("prompt").then(setPrompt);
    getStorage<FilterRuleItem[]>("filterRules").then(setFilterRules);
  }, []);

  const updateModel = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value);
    setStorage("model", e.target.value);
  }, []);

  const updateApiURL = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setApiURL(e.target.value);
    setStorage("apiURL", e.target.value);
  }, []);

  const updateFilterRules = useCallback((rules: FilterRuleItem[]) => {
    setFilterRules(rules);
    setStorage("filterRules", rules);
  }, []);

  const updatePrompt = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt: string = e.target.value;
    setIsPromptValid(
      /{{tabURL}}/.test(newPrompt) &&
        /{{tabTitle}}/.test(newPrompt) &&
        /{{types}}/.test(newPrompt)
    );
    if (isPromptValid) {
      setPrompt(newPrompt);
      setStorage("prompt", newPrompt);
    }
  }, []);

  return (
    <div className="w-screen h-screen flex justify-center p-12">
      <div className="w-full max-w-4xl flex flex-col gap-y-8">
        <h1 className="text-4xl font-semibold border-b border-black pb-2">
          Options Page
        </h1>

        <div className="flex flex-col gap-y-2">
          <label htmlFor="models" className="text-xl font-medium">
            Choose an model
          </label>

          <select
            value={model}
            onChange={updateModel}
            id="models"
            className="bg-gray-50 border w-64 border-gray-300 text-gray-900 text-sm rounded-lg
          focus:ring-blue-500 focus:border-blue-500 block"
          >
            <option selected>Choose a model</option>
            <option value="gpt-4">GPT 4</option>
            <option value="gpt-4-32k">GPT 4 32k</option>
            <option value="gpt-3.5-turbo-1106">GPT 3.5 turbo 1106</option>
            <option value="gpt-3.5-turbo">GPT 3.5 turbo</option>
          </select>
        </div>

        <div className="flex flex-col gap-y-2">
          <label htmlFor="api_url" className="text-xl font-medium">
            API URL
          </label>

          <input
            className="bg-gray-50 border w-64 border-gray-300 text-gray-900 text-sm rounded-lg
          focus:ring-blue-500 focus:border-blue-500 block"
            value={apiURL}
            onChange={updateApiURL}
            id="api_url"
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <label htmlFor="prompt" className="text-xl font-medium">
            Prompt
          </label>
          {isPromptValid && (
            <label
              htmlFor="prompt"
              className="text-sm font-normal w-64 text-blue-500"
            >
              {promptFormatWarning}
            </label>
          )}

          {!isPromptValid && (
            <div
              className=" w-64 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">{promptFormatWarning}</span>
            </div>
          )}

          <textarea
            className="bg-gray-50 border w-64 h-64 border-gray-300 text-gray-900 text-sm rounded-lg
          focus:ring-blue-500 focus:border-blue-500 block"
            value={prompt}
            onChange={updatePrompt}
            id="prompt"
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <label htmlFor="api_url" className="text-xl font-medium">
            Filter Rule
          </label>

          <FilterRules
            updateFilterRules={updateFilterRules}
            filterRules={filterRules || []}
          />
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
