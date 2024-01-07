import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { batchGroupTabs, validateApiKey } from "./services";
import { getStorage, setStorage } from "./utils";
import Input from "./components/Input";
import Switch from "./components/Switch";
import { ColorPicker } from "./components/ColorPicker";
import { Color, DEFAULT_GROUP, TabColorConfig } from "./const";
import { toast } from "./components/toast";
import { ServiceProvider } from "./types";

import "./popup.css";
import { getDomainMatchedType } from "./service-provider/openai-embeddings";

const getApiKeyHrefMap = {
  Gemini: "https://ai.google.dev/",
  GPT: "https://platform.openai.com/api-keys",
};

const Group = () => {
  const [types, setTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState<string>("");
  const [color, setColor] = useState<Color>(Color.grey);
  const [colors, setColors] = useState<Color[]>([]);
  const [colorsEnabled, setColorsEnabled] = useState<boolean>(false);

  // TODO this useEffect is hacky, need to find a better way to do this
  useEffect(() => {
    getStorage<string[]>("types").then((types) => {
      if (!types) {
        setTypes(DEFAULT_GROUP);
        setStorage<string[]>("types", DEFAULT_GROUP);
        return;
      }
      setTypes(types);
    });
    getStorage<Color[]>("colors").then((colors) => {
      if (colors) setColors(colors);
    });
    getStorage<boolean>("colorsEnabled").then((colorsEnabled) => {
      if (colorsEnabled !== undefined) setColorsEnabled(colorsEnabled);
    });
  }, []);

  return (
    <div className="flex flex-col gap-y-2 mb-2">
      <form
        onSubmit={(e) => {
          if (!newType) {
            return;
          }
          const newTypes = [...types, newType];
          const newColors = colorsEnabled
            ? [...colors, color]
            : [
                ...colors,
                TabColorConfig.map(({ name }) => name)[
                  Math.floor(Math.random() * TabColorConfig.length)
                ],
              ];
          setNewType("");
          setTypes(newTypes);
          setColors(newColors);
          e.preventDefault();

          setStorage<string[]>("types", newTypes);
          setStorage<string[]>("colors", newColors);
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
          {colorsEnabled && <ColorPicker color={color} onChange={setColor} />}
          <button
            disabled={!newType}
            className="rounded-md w-fit bg-primary/lg px-2.5 py-1.5 text-sm font-semibold
      text-white shadow-sm hover:bg-primary focus-visible:outline focus-visible:outline-2
      focus-visible:outline-offset-2 disabled:bg-primary/sm"
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
          {colorsEnabled && (
            <ColorPicker
              color={colors[idx]}
              onChange={(newColor) => {
                const newColors = [...colors];
                newColors[idx] = newColor;
                setColors(newColors);
                setStorage<string[]>("colors", newColors);
              }}
            />
          )}
          <button
            onClick={() => {
              const newTypes = [...types];
              const newColors = [...colors];
              newTypes.splice(idx, 1);
              newColors.splice(idx, 1);

              setTypes(newTypes);
              setColors(newColors);
              setStorage<string[]>("types", newTypes);
              setStorage<string[]>("colors", newColors);
            }}
            className="select-none"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

const Popup = () => {
  const [serviceProvider, setServiceProvider] = useState<ServiceProvider>(
    "GPT"
  );
  const [apiKey, setApiKey] = useState<string | undefined>("");
  const [types, setTypes] = useState<string[]>([]);
  const [isOn, setIsOn] = useState<boolean | undefined>(true);
  const [isAutoPosition, setIsAutoPosition] = useState<boolean | undefined>(
    false
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // TODO this useEffect is hacky, need to find a better way to do this
  useEffect(() => {
    getStorage<string>("openai_key").then(setApiKey);
    getStorage<boolean>("isOn").then(setIsOn);
    getStorage<boolean>("isAutoPosition").then(setIsAutoPosition);
    getStorage<string[]>("types").then((types) => {
      if (!types) {
        setTypes(DEFAULT_GROUP);
        setStorage<string[]>("types", DEFAULT_GROUP);
        return;
      }
      setTypes(types);
    });
    getStorage<ServiceProvider>("serviceProvider").then((value) => {
      if (value) {
        setServiceProvider(value);
      }
    });
  }, []);

  const updateOpenAIKey = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  }, []);

  const updateKeyInStorage = useCallback(() => {
    setStorage("openai_key", apiKey);
  }, [apiKey]);

  const getAllTabsInfo = async () => {
    if (!apiKey || !types || !types.length) {
      return;
    }
    try {
      setIsLoading(true);
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const result = await batchGroupTabs(tabs, types, apiKey);
      chrome.runtime.sendMessage({ result });
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error("Failed to group tabs: " + error.message);
      } else {
        toast.error("Failed to group tabs");
      }
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

  const enableAutoPosition = () => {
    setIsAutoPosition(() => {
      setStorage("isAutoPosition", !isAutoPosition);
      return !isAutoPosition;
    });
  };

  const ungroup = async () => {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      chrome.tabs.ungroup(tabs.map((tab) => tab.id!));
      toast.success("Ungrouped all tabs");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error("Failed to ungroup tabs: " + error.message);
      } else {
        toast.error("Failed to ungroup tabs");
      }
    }
  };

  const handleValidateOpenAIKey = async () => {
    if (!apiKey || apiKey.length <= 0) {
      toast.warn("Please enter an API key");
      return false;
    }
    setIsValidating(true);
    await validateApiKey(apiKey, serviceProvider);
    setIsValidating(false);
  };

  const smartGroup = async () => {
    console.log("smartGroup");

    if (!apiKey) {
      return;
    }
    const tabs = await chrome.tabs.query({ currentWindow: true });
    // TODO filter out tabs that match filterRules
    for (const tab of tabs) {
      if (!tab.url) continue;
      const matchData = await getDomainMatchedType(apiKey, tab.url);
      // TODO group tab
      console.log(tab.url, matchData?.type, matchData);
    }
  };

  return (
    <div className="p-6 pb-9 min-w-[24rem] ">
      <div className="flex items-center mb-6 justify-between">
        <h1 className="text-xl font-bold">AI Group Tab</h1>

        <button
          onClick={() => {
            chrome.runtime.openOptionsPage();
          }}
        >
          <img src="/cog.svg" alt="cog" className="w-6 h-6" />
        </button>
      </div>

      <div className="relative mb-2">
        <label
          className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900"
          htmlFor="openai-key"
        >
          API Key
        </label>

        <div className="flex items-center gap-x-2">
          <Input
            id="openai-key"
            type="password"
            onChange={updateOpenAIKey}
            onBlur={updateKeyInStorage}
            value={apiKey}
            placeholder="Your OpenAI Key"
          />

          <button
            onClick={handleValidateOpenAIKey}
            disabled={!apiKey}
            className="rounded-md flex items-center w-fit bg-primary/lg px-2.5 py-1.5 text-sm font-semibold
            text-white shadow-sm hover:bg-primary focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 disabled:bg-primary/sm"
          >
            {isValidating && <LoadingSpinner />}
            Validate
          </button>
        </div>
      </div>

      {!apiKey?.length && (
        <div className="text-sm text-gray-500 mb-2">
          You can get your key from{" "}
          <a
            href={getApiKeyHrefMap[serviceProvider] || getApiKeyHrefMap.GPT}
            target="_blank"
            rel="noreferrer"
            className="text-primary/lg underline underline-offset-2 hover:text-primary"
          >
            here
          </a>
        </div>
      )}

      <Group />

      <div className="flex items-center gap-x-4">
        <button
          disabled={!apiKey || !types || !types.length}
          className="inline-flex items-center rounded-md bg-primary/lg px-2.5 py-1.5 text-sm font-semibold
        text-white shadow-sm hover:bg-primary focus-visible:outline cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap"
          onClick={getAllTabsInfo}
        >
          {isLoading && <LoadingSpinner />}
          Group Existing Tabs
        </button>

        <button
          className="inline-flex items-center rounded-md bg-primary/lg px-2.5 py-1.5 text-sm font-semibold
        text-white shadow-sm hover:bg-primary focus-visible:outline cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap"
          onClick={ungroup}
        >
          Ungroup All
        </button>
        <button
          className="inline-flex items-center rounded-md bg-primary/lg px-2.5 py-1.5 text-sm font-semibold
        text-white shadow-sm hover:bg-primary focus-visible:outline cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap"
          onClick={smartGroup}
        >
          Smart Group
        </button>
      </div>

      <Switch
        isChecked={!!isOn}
        text="Allow automatic grouping"
        onChange={disableGrouping}
      />

      <Switch
        isChecked={!!isAutoPosition}
        text="Allow automatic position"
        onChange={enableAutoPosition}
      />
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
