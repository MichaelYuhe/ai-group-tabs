import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { batchGroupTabs } from "./services";
import { getStorage, setStorage } from "./utils";
import "./popup.css";
import Input from "./components/Input";
import Switch from "./components/Switch";
import { ColorPicker } from "./components/ColorPicker";
import { Color, DEFAULT_GROUP, TabColorConfig } from "./const";
import { toast } from "./components/toast";
import { ServiceProvider } from "./types";

const getApiKeyHrefMap = {
  Gemini: "https://ai.google.dev/",
  GPT: "https://platform.openai.com/api-keys",
};

const Popup = () => {
  const [serviceProvider, setServiceProvider] = useState<ServiceProvider>(
    "GPT"
  );
  const [openAIKey, setOpenAIKey] = useState<string | undefined>("");
  const [types, setTypes] = useState<string[]>([]);
  const [isOn, setIsOn] = useState<boolean | undefined>(true);
  const [isAutoPosition, setIsAutoPosition] = useState<boolean | undefined>(
    false
  );
  const [newType, setNewType] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidated, setIsValidated] = useState<boolean | undefined>(
    undefined
  );
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [color, setColor] = useState<Color>(Color.grey);
  const [colors, setColors] = useState<Color[]>([]);
  const [colorsEnabled, setColorsEnabled] = useState<boolean>(false);
  useEffect(() => {
    getStorage<string>("openai_key").then(setOpenAIKey);
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
    getStorage<Color[]>("colors").then((colors) => {
      if (colors) setColors(colors);
    });
    getStorage<boolean>("colorsEnabled").then((colorsEnabled) => {
      if (colorsEnabled !== undefined) setColorsEnabled(colorsEnabled);
    });
    getStorage<ServiceProvider>("serviceProvider").then((value) => {
      if (value) {
        setServiceProvider(value);
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
      toast({
        type: "success",
        message: "Ungrouped all tabs",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleValidateOpenAIKey = async () => {
    if (!openAIKey) {
      return;
    }

    setIsValidating(true);
    try {
      if (serviceProvider === "Gemini") {
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta3/models/text-bison-001:generateText?key=" +
            openAIKey,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: { text: "This is a test" },
            }),
          }
        );
        if (response.status === 200) {
          setIsValidated(true);
        } else {
          setIsValidated(false);
          const txt = await response.text();
          toast({
            type: "error",
            message: "Invalid Genmini Key: " + response.status + " " + txt,
          });
        }
      } else {
        const response = await fetch(
          "https://api.openai.com/v1/engines/davinci/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openAIKey}`,
            },
            body: JSON.stringify({
              prompt: "This is a test",
              max_tokens: 5,
              temperature: 0.5,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0,
              stop: ["\n"],
            }),
          }
        );
        if (response.status === 200) {
          setIsValidated(true);
        } else {
          setIsValidated(false);
          const txt = await response.text();
          toast({
            type: "error",
            message: "Invalid OpenAI Key: " + response.status + " " + txt,
          });
        }
      }
    } catch (error) {
      setIsValidated(false);
      console.error(error);
      if (error instanceof Error) {
        toast({
          type: "error",
          message: "Invalid OpenAI Key: " + error.message,
        });
      } else {
        toast({
          type: "error",
          message: "Invalid OpenAI Key",
        });
      }
    } finally {
      setIsValidating(false);

      setTimeout(() => {
        setIsValidated(undefined);
      }, 3000);
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
            value={openAIKey}
            placeholder="Your OpenAI Key"
          />

          <button
            onClick={handleValidateOpenAIKey}
            disabled={!openAIKey}
            className="rounded-md flex items-center w-fit bg-primary/lg px-2.5 py-1.5 text-sm font-semibold
            text-white shadow-sm hover:bg-primary focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 disabled:bg-primary/sm"
          >
            {isValidating && <LoadingSpinner />}
            {isValidated === undefined ? (
              "Validate"
            ) : isValidated ? (
              <img src="/check.svg" alt="check" />
            ) : (
              <img src="/error.svg" alt="error" />
            )}
          </button>
        </div>
      </div>

      {!openAIKey?.length && (
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

      <div className="flex items-center gap-x-4">
        <button
          disabled={!openAIKey || !types || !types.length}
          className="inline-flex items-center rounded-md bg-primary/lg px-2.5 py-1.5 text-sm font-semibold
        text-white shadow-sm hover:bg-primary focus-visible:outline cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={getAllTabsInfo}
        >
          {isLoading && <LoadingSpinner />}
          Group Existing Tabs
        </button>

        <button
          className="inline-flex items-center rounded-md bg-primary/lg px-2.5 py-1.5 text-sm font-semibold
        text-white shadow-sm hover:bg-primary focus-visible:outline cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={ungroup}
        >
          Ungroup All
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
