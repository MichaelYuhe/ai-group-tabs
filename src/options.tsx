import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./options.css";
import { DEFAULT_PROMPT, getStorage, setStorage } from "./utils";
import Switch from "./components/Switch";
import FilterRules from "./components/FilterRules";
import { FilterRuleItem } from "./types";

const TABS = [
  "Basic Settings",
  "Prompt Settings",
  "Style Settings",
  "Feature Flags",
];

function BasicSettings() {
  const [model, setModel] = useState<string | undefined>("gpt-3.5-turbo");
  const [apiURL, setApiURL] = useState<string | undefined>(
    "https://api.openai.com/v1/chat/completions"
  );
  const [filterRules, setFilterRules] = useState<FilterRuleItem[] | undefined>([
    { id: 0, type: "DOMAIN", rule: "" },
  ]);
  useEffect(() => {
    getStorage<string>("model").then(setModel);
    getStorage<string>("apiURL").then(setApiURL);
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

  return (
    <div className="flex flex-col gap-y-8 p-4">
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
        <label htmlFor="api_url" className="text-xl font-medium">
          Filter Rule
        </label>

        <FilterRules
          updateFilterRules={updateFilterRules}
          filterRules={filterRules || []}
        />
      </div>
    </div>
  );
}

function PromptSettings() {
  const [prompt, setPrompt] = useState<string | undefined>(DEFAULT_PROMPT);
  const [isPromptValid, setIsPromptValid] = useState<boolean>(true);

  const promptFormatWarning: string = `{{tabURL}}, {{tabTitle}} and {{types}} must be in the prompt`;

  useEffect(() => {
    getStorage<string>("prompt").then(setPrompt);
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
    <div className="flex flex-col gap-y-8 p-4">
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
    </div>
  );
}

function StyleSettings() {
  return <div className="flex flex-col p-4"></div>;
}

function FeatureFlags() {
  const [isColorsEnabled, setIsColorsEnabled] = useState<boolean | undefined>(
    false
  );

  useEffect(() => {
    getStorage<boolean>("colorsEnabled").then(setIsColorsEnabled);
  }, []);

  const updateColorsEnabled = useCallback(() => {
    setIsColorsEnabled(!isColorsEnabled);
    setStorage("colorsEnabled", !isColorsEnabled);
  }, [isColorsEnabled]);

  return (
    <div className="flex flex-col p-4">
      <Switch
        isChecked={isColorsEnabled !== undefined ? isColorsEnabled : false}
        onChange={() => {
          updateColorsEnabled();
        }}
        text="Enable Colors Customization"
      />
    </div>
  );
}

const Options = () => {
  const [activeTab, setActiveTab] = useState<string>(TABS[0]);

  return (
    <div className="w-screen h-screen bg-slate-100 flex justify-center p-12">
      <div className="w-full max-w-4xl flex flex-col">
        <div className="flex w-full p-2 bg-slate-200 rounded-2xl">
          {TABS.map((tab) => (
            <button
              className={`${
                activeTab === tab ? "bg-white" : ""
              } flex-1 text-center py-4 font-medium rounded-lg`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Basic Settings */}
        {activeTab === TABS[0] && <BasicSettings />}

        {activeTab === TABS[1] && <PromptSettings />}

        {activeTab === TABS[2] && <StyleSettings />}

        {activeTab === TABS[3] && <FeatureFlags />}
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
