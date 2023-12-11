import React from "react";
import { createRoot } from "react-dom/client";
import "./options.css";
import { useStorage } from "@plasmohq/storage/hook";
import { getValueOrPersistDefault } from "./utils";

const Options = () => {
  const [model, setModel] = useStorage<string>(
    "model",
    getValueOrPersistDefault("gpt-3.5-turbo")
  );
  const [apiURL, setApiURL] = useStorage<string>(
    "apiURL",
    getValueOrPersistDefault("https://api.openai.com/v1/chat/completions")
  );

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
            onChange={(e) => setModel(e.target.value)}
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
            onChange={(e) => setApiURL(e.target.value)}
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
