import { FilterRuleItem, ServiceProvider } from "./types";

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

export function matchesRule(url: URL, rule: FilterRuleItem) {
  const { type, rule: value } = rule;
  if (!value) {
    return false;
  }
  const host = url.host;
  switch (type) {
    case "DOMAIN":
      // Exact match; example.com should match example.com
      return host === value;
    case "DOMAIN-SUFFIX":
      // Suffix matching; example.com should match www.example.com
      return host.endsWith("." + value) || host === value;
    case "DOMAIN-KEYWORD":
      // Keyword matching; example should match www.example.com
      return host.includes(value);
    case "REGEX":
      // Regular expression matching; https?://mail.google.com/* should match https://mail.google.com/mail/u/0/#inbox
      return new RegExp(value).test(url.href);
    default:
      // If the rule type is unknown, return false.
      return false;
  }
}

export function getRootDomain(url: URL) {
  const host = url.host;
  const parts = host.split(".");
  if (parts.length <= 2) {
    return host;
  }
  return parts.slice(1).join(".");
}

export const getTabsFromGroup = async (
  groupId: number
): Promise<chrome.tabs.Tab[]> => {
  return new Promise((resolve) => {
    chrome.tabs.query({ groupId }, (tabs) => {
      resolve(tabs);
    });
  });
};

export const tabGroupMap: {
  [key: number]: {
    type: "manual" | "setting";
    title: string;
  };
} = {};

export const createdManualType = (
  types: string[],
  group: chrome.tabGroups.TabGroup
) => {
  if (!group.title) return;
  const hasCreatedType = types.find((type, index) => {
    if (type === group.title) {
      types[index] = group.title;
      return true;
    }
    return false;
  });
  if (!hasCreatedType) {
    types.push(group.title);
    tabGroupMap[group.id] = { type: "manual", title: group.title };
    setStorage<string[]>("types", types);
  }
};

export const updatedManualType = (
  types: string[],
  group: chrome.tabGroups.TabGroup
) => {
  if (!group.title) return;
  const existType = types.findIndex(
    (type) => type === tabGroupMap[group.id].title
  );
  if (existType) {
    types.splice(existType, 1, group.title);
    tabGroupMap[group.id] = { type: "manual", title: group.title };
    setStorage<string[]>("types", types);
  }
};

export const curryFilterManualGroups = async () => {
  const manualGroups = Object.entries(tabGroupMap).filter(
    ([_groupId, group]) => group.type === "manual"
  );
  const manualGroupsTabs = (
    await Promise.all(
      manualGroups.map(async ([groupId, _group]) => {
        const groupTabs = getTabsFromGroup(parseInt(groupId));
        return groupTabs;
      })
    )
  ).flat();

  // filter out tabs that are in manual groups
  return (tabId: number) => {
    return !manualGroupsTabs.map((tab) => tab.id).includes(tabId);
  };
};

export const getServiceProvider = async () => {
  const serviceProvider =
    (await getStorage<ServiceProvider>("serviceProvider")) || "GPT";
  return serviceProvider;
};

export const removeQueryParameters = (
  urlString: string | undefined
): string => {
  if (typeof urlString !== "string") {
    return "about:blank";
  }
  const url = new URL(urlString);
  url.search = "";
  return url.toString();
};

/**
 * Cosine similarity
 * See https://en.wikipedia.org/wiki/Cosine_similarity
 *
 * If use the `text-embedding-ada-002` model from openAI API, the embedding length is `1536`.
 */
export const cosineSimilarity = (
  embedding1: number[],
  embedding2: number[]
) => {
  if (embedding1.length !== embedding2.length) {
    console.error("embedding1", embedding1, "embedding2", embedding2);
    throw new Error("embedding1 and embedding2 should have same length");
  }
  const dotProduct = embedding1.reduce((acc, cur, index) => {
    return acc + cur * embedding2[index];
  }, 0);
  const norm1 = Math.sqrt(embedding1.reduce((acc, cur) => acc + cur * cur, 0));
  const norm2 = Math.sqrt(embedding2.reduce((acc, cur) => acc + cur * cur, 0));
  return dotProduct / (norm1 * norm2);
};
