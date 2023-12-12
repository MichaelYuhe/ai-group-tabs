import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { batchGroupTabs } from "./services";
import { DEFAULT_COLOR, DEFAULT_GROUP, getStorage, setStorage } from "./utils";

import "./popup.css";
import Input from "./components/Input";

const Popup = () => {
  const [openAIKey, setOpenAIKey] = useState<string | undefined>("");
  const [types, setTypes] = useState<string[]>([]);
  const [isOn, setIsOn] = useState<boolean | undefined>(true);
  const [newType, setNewType] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [color, setColor] = useState<string>("grey");
  const [colors, setColors] = useState<string[]>([]);
  const colorsRef = useRef<HTMLElement[]>([]);

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
    getStorage<string[]>("colors").then((colors) => {
      if (colors) setColors(colors);
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

  const ungroup = async () => {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      chrome.tabs.ungroup(tabs.map((tab) => tab.id!));
    } catch (error) {
      console.error(error);
    }
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
            const newColors = [...colors, color];
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
        <div className="flex items-center gap-x-2">
          {DEFAULT_COLOR.map((colorOption) => (
            <input
              type="radio"
              name="color"
              className={`bg-${colorOption}-500 w-4 h-4 rounded-full`}
              style={{
                backgroundColor: colorOption,
                borderColor: "transparent",
                ["--tw-ring-color"]: colorOption,
              }}
              checked={color === colorOption}
              value={colorOption}
              onChange={(e) => {
                setColor(e.target.value);
                console.log(e.target.value);
              }}
            ></input>
          ))}
        </div>

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
            <div
              ref={(node) => {
                colorsRef.current[idx] = node;
              }}
              className={`bg-${colors[idx]}-500 w-4 h-4`}
              style={{
                backgroundColor: colors[idx],
                flexShrink: 0,
              }}
            ></div>
            <svg
              t="1702386306969"
              class="icon"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="1448"
              width="16"
              height="16"
              onClick={(e) => {
                let nextIdx =
                  (DEFAULT_COLOR.indexOf(colors[idx]) + 1) %
                  DEFAULT_COLOR.length;
                const newColors = [...colors];
                newColors[idx] = DEFAULT_COLOR[nextIdx];
                colorsRef.current[idx].animate(
                  [{ opacity: "0" }, { opacity: "1" }],
                  {
                    duration: 400,
                  }
                );
                setColors(newColors);
                setStorage<string[]>("colors", newColors);
              }}
            >
              <path
                d="M312.888889 995.555556c-17.066667 0-28.444444-5.688889-39.822222-17.066667-22.755556-22.755556-17.066667-56.888889 5.688889-79.644445l364.088888-329.955555c11.377778-11.377778 17.066667-22.755556 17.066667-34.133333 0-11.377778-5.688889-22.755556-17.066667-34.133334L273.066667 187.733333c-22.755556-22.755556-28.444444-56.888889-5.688889-79.644444 22.755556-22.755556 56.888889-28.444444 79.644444-5.688889l364.088889 312.888889c34.133333 28.444444 56.888889 73.955556 56.888889 119.466667s-17.066667 85.333333-51.2 119.466666l-364.088889 329.955556c-11.377778 5.688889-28.444444 11.377778-39.822222 11.377778z"
                fill="#999999"
                p-id="1449"
              ></path>
            </svg>
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
              style={{ userSelect: "none" }}
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
