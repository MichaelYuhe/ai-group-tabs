export function setStorage<V = any>(key: string, value: V) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(true);
      }
    });
  });
}

export function getStorage<V = any>(key: string): Promise<V | undefined> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
}

export const DEFAULT_GROUP = [
  "Social",
  "Entertainment",
  "Read Material",
  "Education",
  "Productivity",
  "Utilities",
];

export const DEFAULT_COLOR = [
  "grey",
  "blue",
  "red",
  "yellow",
  "green",
  "pink",
  "purple",
  "cyan",
  "orange",
];
export const DEFAULT_PROMPT: string =
  `Based on the URL: "{{tabURL}}" and title: "{{tabTitle}}", ` +
  `classify the browser tab type as one of the following: "{{types}}". ` +
  `Respond with only the classification keyword from the list.`;
