import { handleOneTab } from "./services";
import { getStorage } from "./utils";

export const TYPES = ["Develop", "Entertainment", "Reading", "Social"];

const tabMap = new Map<string, number>();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const result = message.result;

  TYPES.forEach((_, i) => groupOneType(result[i].type, result[i].tabIds));
});

chrome.tabGroups.onCreated.addListener((group) => {
  if (!group.title) return;
  const type = group.title;

  if (tabMap.has(type)) {
    return;
  }

  tabMap.set(type, group.id);
});

async function groupOneType(type: string, tabIds: number[]) {
  if (tabIds.length === 0) return;

  console.log(tabIds);

  chrome.tabs.group({ tabIds }, async (groupId) => {
    await chrome.tabGroups.update(groupId, { title: type });
  });
}

async function handleNewTab(tab: chrome.tabs.Tab) {
  getStorage<string>("openai_key")
    .then(async (openAIKey) => {
      if (!tab.id) return;

      const type = await handleOneTab(tab, openAIKey);
      const groupId = tabMap.get(type);

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

function handleTabUpdate(tabId: any, changeInfo: any, tab: any) {
  if (changeInfo.status === "complete") {
    getStorage<string>("openai_key")
      .then(async (openAIKey) => {
        if (!tab.id) return;

        const type = await handleOneTab(tab, openAIKey);
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
