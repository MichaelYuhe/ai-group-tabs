import { handleOneTab } from "./services";
import { getStorage } from "./utils";

let types: string[] = [];

chrome.storage.local.get("types", (result) => {
  if (result.types) {
    types = result.types;
  }
});

const tabMap = new Map<string, number>();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  chrome.storage.local.get("types", (result) => {
    if (result.types) {
      types = result.types;
    }
  });

  const result = message.result;

  types.forEach((_, i) => groupOneType(result[i].type, result[i].tabIds));
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
  if (!openAIKey) return;

  const type = await handleOneTab(tab, types, openAIKey);

  // Check if a group already exists for this type
  let groupId = tabMap.get(type);

  if (groupId !== undefined) {
    // Verify if the existing group ID is still valid
    const allGroups = await chrome.tabGroups.query({});
    const groupExists = allGroups.some((group) => group.id === groupId);

    if (groupExists) {
      // Existing group is valid, add tab to this group.
      await chrome.tabs.group({ tabIds: tab.id, groupId });
    } else {
      // If the group does not exist anymore, remove it from the map.
      tabMap.delete(type);
    }
  } else {
    // If no valid group is found, create a new group for this type
    await createGroupWithTitle(tab.id, type);
  }
}

async function handleNewTab(tab: chrome.tabs.Tab) {
  const enable = await getStorage<boolean>("isOn");
  if (
    !enable ||
    !tab.id ||
    !tab.url ||
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
  if (
    !enable ||
    !tab.id ||
    !tab.url ||
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
