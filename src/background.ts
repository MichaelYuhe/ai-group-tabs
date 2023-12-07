import { batchGroupTabs } from "./services";
import { getStorage } from "./utils";

export const TYPES = ["Develop", "Entertainment", "Reading", "Social"];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const result = message.result;

  TYPES.forEach((_, i) => groupOneType(result[i].type, result[i].tabIds));
});

async function groupOneType(type: string, tabIds: number[]) {
  if (tabIds.length === 0) return;
  chrome.tabs.group({ tabIds: tabIds }, async (groupId) => {
    await chrome.tabGroups.update(groupId, { title: type });
  });
}

function handleNewTab(tab: chrome.tabs.Tab) {
  getStorage<string>('openai_key').then(openAIKey => {
      chrome.tabs.query({ currentWindow: true }).then(tabs => {
          batchGroupTabs(tabs, TYPES, openAIKey).then(result => {
            TYPES.forEach((_, i) => groupOneType(result[i].type, result[i].tabIds as number[]));
          });
      });
  }).catch(error => {
      console.error('Error in handleNewTab:', error);
  });
}

function handleTabUpdate(tabId: any, changeInfo: any, tab: any) {
  if (changeInfo.status === 'complete') {
      getStorage<string>('openai_key').then(openAIKey => {
          chrome.tabs.query({ currentWindow: true }).then(tabs => {
              batchGroupTabs(tabs, TYPES, openAIKey).then(result => {
                  TYPES.forEach((_, i) => groupOneType(result[i].type, result[i].tabIds as number[]));
              });
          });
      }).catch(error => {
          console.error('Error in handleTabUpdate:', error);
      });
  }
}

chrome.tabs.onCreated.addListener(handleNewTab);
chrome.tabs.onUpdated.addListener(handleTabUpdate);