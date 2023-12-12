import { handleOneTab } from "./services";
import { DEFAULT_GROUP, DEFAULT_PROMPT, getStorage, setStorage } from "./utils";
import { pipeline, env, Pipeline } from "@xenova/transformers";

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

console.log("ok background");

class PipelineSingleton {
  static task = "zero-shot-classification";
  static model = "Xenova/mobilebert-uncased-mnli";
  static instance: Pipeline | null = null;

  static async getInstance(progress_callback = null) {
    console.log("get instance");
    if (this.instance === null) {
      if (progress_callback) {
        this.instance = await pipeline(this.task, this.model, {
          progress_callback,
        });
      } else {
        this.instance = await pipeline(this.task, this.model);
      }
    }

    return this.instance;
  }
}

const classify = async (text: string, labels: string[]): Promise<string> => {
  let model = await PipelineSingleton.getInstance();
  let result = await model(text, labels);
  console.log(model);
  console.log(result);
  return result.labels[0];
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    setStorage<boolean>("isOn", true);
    setStorage<string[]>("types", DEFAULT_GROUP);
    setStorage<string>("prompt", DEFAULT_PROMPT);
  }
});

let types: string[] = [];

chrome.storage.local.get("types", (result) => {
  if (result.types) {
    types = result.types;
  }
});

const tabMap = new Map<string, number>();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  chrome.storage.local.get("types", (resultStorage) => {
    if (resultStorage.types) {
      types = resultStorage.types;

      const result = message.result;
      types.forEach((_, i) => {
        // Check if result[i] exists before accessing the 'type' property
        if (result[i]) {
          groupOneType(result[i].type, result[i].tabIds);
        } else {
          // Handle the case where there is no corresponding entry in result for this type
          console.error(`No corresponding result for type index ${i}`);
        }
      });
    }
  });
});

chrome.tabGroups.onUpdated.addListener((group) => {
  if (!group.title) return;
  const type = group.title;

  if (tabMap.has(type)) return;

  tabMap.set(type, group.id);
});

async function groupOneType(type: string, tabIds: number[]) {
  if (tabIds.length === 0) return;

  chrome.tabs.group({ tabIds }, async (groupId) => {
    await chrome.tabGroups.update(groupId, { title: type });
  });
}

async function createGroupWithTitle(tabId: number, title: string) {
  try {
    const groupId = await chrome.tabs.group({ tabIds: [tabId] });
    await chrome.tabGroups.update(groupId, { title });
    tabMap.set(title, groupId);
  } catch (error) {
    console.error("Error creating tab group:", error);
    throw error;
  }
}

async function processTabAndGroup(tab: chrome.tabs.Tab, types: any) {
  if (!tab.id) {
    throw new Error("Tab ID is undefined!");
  }
  const openAIKey = await getStorage<string>("openai_key");
  const model = await getStorage<string>("model");
  let type: string;

  if (model === "transformer.js") {
    type = await classify(`${tab.title} ${tab.url}`, types);
  } else {
    if (!openAIKey) {
      return;
    } else {
      type = await handleOneTab(tab, types, openAIKey);
    }
  }

  // Query all groups and update tabMap accordingly
  const allGroups = await chrome.tabGroups.query({});
  allGroups.forEach(
    (group) => group.title && tabMap.set(group.title, group.id)
  );

  // Check if a group already exists for this type
  const groupId = tabMap.get(type);

  // If groupId is not undefined, it means a group with that type already exists
  if (groupId !== undefined) {
    // Existing group is valid, add tab to this group.
    await chrome.tabs.group({ tabIds: tab.id, groupId });
  } else {
    // If no valid group is found, create a new group for this type
    await createGroupWithTitle(tab.id, type);
  }
}

async function handleNewTab(tab: chrome.tabs.Tab) {
  const enable = await getStorage<boolean>("isOn");
  const window = await chrome.windows.get(tab.windowId);
  if (
    !enable ||
    !tab.id ||
    !tab.url ||
    window.type != "normal" ||
    !types.length ||
    (tab.status === "complete" && tab.url.startsWith("chrome://"))
  ) {
    return;
  }
  try {
    await processTabAndGroup(tab, types);
  } catch (error) {
    console.error("Error in handleNewTab:", error);
  }
}

async function handleTabUpdate(
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab
) {
  const enable = await getStorage<boolean>("isOn");
  const window = await chrome.windows.get(tab.windowId);
  if (
    !enable ||
    !tab.id ||
    !tab.url ||
    window.type != "normal" ||
    tab.url.startsWith("chrome://") ||
    changeInfo.status !== "complete"
  ) {
    return;
  }

  try {
    await processTabAndGroup(tab, types);
  } catch (error) {
    console.error("Error in handleTabUpdate:", error);
  }
}

chrome.tabs.onCreated.addListener(handleNewTab);
chrome.tabs.onUpdated.addListener(handleTabUpdate);
