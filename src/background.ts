import { handleOneTab } from "./services";
import { DEFAULT_GROUP, DEFAULT_PROMPT, getStorage, setStorage } from "./utils";

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    setStorage<boolean>("isOn", true);
    setStorage<boolean>("isAutoPosition", false);
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

const windowGroupMaps: { [key: number]: Map<string, number> } = {};

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
  if (!windowGroupMaps.hasOwnProperty(group.windowId)) {
    windowGroupMaps[group.windowId] = new Map<string, number>();
  }
  if (group.title) {
    windowGroupMaps[group.windowId].set(group.title, group.id);
  }
});

async function groupOneType(type: string, tabIds: number[]) {
  if (tabIds.length === 0) return;

  const windowIdMap: { [key: number]: number[] } = {};

  const getTab = (tabId: number) =>
    new Promise((resolve) => {
      chrome.tabs.get(tabId, (tab) => {
        if (!windowIdMap[tab.windowId]) {
          windowIdMap[tab.windowId] = [tabId];
        } else {
          windowIdMap[tab.windowId].push(tabId);
        }
        resolve(tab);
      });
    });

  await Promise.all(tabIds.map((tabId) => getTab(tabId)));

  for (const windowId in windowIdMap) {
    const tabsForWindow = windowIdMap[windowId];
    chrome.tabs.group({ tabIds: tabsForWindow }, async (groupId) => {
      await chrome.tabGroups.update(groupId, { title: type });
    });
  }
}

async function createGroupWithTitle(tabId: number, title: string) {
  try {
    chrome.tabs.get(tabId, async (tab) => {
      if (tab.windowId) {
        const groupId = await chrome.tabs.group({ tabIds: [tabId] });
        await chrome.tabGroups.update(groupId, { title });
        windowGroupMaps[tab.windowId].set(title, groupId);
      }
    });
  } catch (error) {
    console.error("Error creating tab group:", error);
    throw error;
  }
}

async function processTabAndGroup(tab: chrome.tabs.Tab, types: any) {
  if (!tab.id || !tab.windowId) {
    throw new Error("Tab ID or WindowID is undefined!");
  }
  const openAIKey = await getStorage<string>("openai_key");
  if (!openAIKey) return;

  const type = await handleOneTab(tab, types, openAIKey);

  // Get or create proper tabMap for the window
  if (!windowGroupMaps.hasOwnProperty(tab.windowId)) {
    windowGroupMaps[tab.windowId] = new Map();
  }
  const tabMap = windowGroupMaps[tab.windowId];

  // Query all groups and update tabMap accordingly
  const allGroups = await chrome.tabGroups.query({});
  allGroups.forEach(
    (group) =>
      group.windowId === tab.windowId &&
      group.title &&
      tabMap.set(group.title, group.id)
  );

  // Check if a group already exists for this type
  const groupId = tabMap.get(type);

  // If groupId is not undefined, it means a group with that type already exists
  if (groupId !== undefined) {
    // Existing group is valid, add tab to this group.
    await chrome.tabs.group({ tabIds: tab.id, groupId });

    const isAutoPosition = await getStorage<boolean>("isAutoPosition");

    const currentWindowTabs = await chrome.tabs.query({
      windowId: tab.windowId,
    });
    const isRightmost =
      tab.index == Math.max(...currentWindowTabs.map((tab) => tab.index));
    if (isAutoPosition && isRightmost) {
      await chrome.tabGroups.move(groupId, { index: -1 });
    }
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
chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
  const windowId = detachInfo.oldWindowId;
  if (
    windowGroupMaps.hasOwnProperty(windowId) &&
    !chrome.tabs.query({ windowId })
  ) {
    delete windowGroupMaps[windowId];
  }
});
