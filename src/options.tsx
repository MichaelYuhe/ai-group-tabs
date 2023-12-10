import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./options.css";
import { getStorage, setStorage } from "./utils";

const Options = () => {
  const [model, setModel] = useState<string | undefined>("gpt-4");
  const [apiURL, setApiURL] = useState<string | undefined>(
    "https://api.openai.com"
  );

  useEffect(() => {
    getStorage<string>("model").then(setModel);
    getStorage<string>("apiURL").then(setApiURL);
  }, []);

  const updateModel = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value);
    setStorage("model", e.target.value);
  }, []);

  const updateApiURL = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setApiURL(e.target.value);
    setStorage("apiURL", e.target.value);
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
            <option value="gpt-3.5">GPT 3.5</option>
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
