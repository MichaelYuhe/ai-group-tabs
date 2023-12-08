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

async function handleNewTab(tab: chrome.tabs.Tab) {
  const isOn = await getStorage<boolean>("isOn");
  if (!isOn) return;
  if (!types.length) {
    return;
  }

  getStorage<string>("openai_key")
    .then(async (openAIKey) => {
      if (!tab.id || !tab.url || tab.url === "chrome://newtab/") return;

      const type = await handleOneTab(tab, types, openAIKey);
      const groupId = tabMap.get(type);

      console.log(type, groupId);

      if (!groupId) {
        console.log("No group id found for type:", type);

        chrome.tabs.group({ tabIds: [tab.id] }, async (groupId) => {
          await chrome.tabGroups.update(groupId, { title: type });
        });

        return;
      }

      const groupTabIds = await chrome.tabs
        .query({
          groupId: groupId,
        })
        .then((tabs) => tabs.map((tab) => tab.id));

      const tabIds = [tab.id, ...(groupTabIds as number[])];

      chrome.tabs.group({ tabIds: tabIds }, async (groupId) => {
        await chrome.tabGroups.update(groupId, { title: type });
      });
    })
    .catch((error) => {
      console.error("Error in handleNewTab:", error);
    });
}

async function handleTabUpdate(tabId: any, changeInfo: any, tab: any) {
  const enable = await getStorage<boolean>("isOn");
  if (!enable) return;
  if (changeInfo.status === "complete") {
    if (!tab.url) return;
    getStorage<string>("openai_key")
      .then(async (openAIKey) => {
        if (!tab.id || !tab.url || tab.url === "chrome://newtab/") return;

        const type = await handleOneTab(tab, types, openAIKey);
        const groupId = tabMap.get(type);

        if (!groupId) {
          chrome.tabs.group({ tabIds: [tab.id] }, async (groupId) => {
            await chrome.tabGroups.update(groupId, { title: type });
          });

          return;
        }

        const groupTabIds = await chrome.tabs
          .query({
            groupId: groupId,
          })
          .then((tabs) => tabs.map((tab) => tab.id));

        const tabIds = [tab.id, ...(groupTabIds as number[])];

        chrome.tabs.group({ tabIds: tabIds }, async (groupId) => {
          await chrome.tabGroups.update(groupId, { title: type });
        });
      })
      .catch((error) => {
        console.error("Error in handleUpdateTab:", error);
      });
  }
}

chrome.tabs.onCreated.addListener(handleNewTab);
chrome.tabs.onUpdated.addListener(handleTabUpdate);
