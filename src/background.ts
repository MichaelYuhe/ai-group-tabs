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
