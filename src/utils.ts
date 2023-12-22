import { toast } from "./components/toast";
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

export const validateApiKey = async (
  apiKey: string,
  serviceProvider: ServiceProvider
) => {
  try {
    if (serviceProvider === "Gemini") {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta3/models/text-bison-001:generateText?key=" +
          apiKey,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: { text: "This is a test" },
          }),
        }
      );
      if (response.status === 200) {
        return true;
      } else {
        const txt = await response.text();
        toast.error("Invalid Gemini Key: " + response.status + " " + txt);
        return false;
      }
    } else {
      const response = await fetch(
        "https://api.openai.com/v1/engines/davinci/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            prompt: "This is a test",
            max_tokens: 5,
            temperature: 0.5,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: ["\n"],
          }),
        }
      );
      if (response.status === 200) {
        toast.success("Valid OpenAI Key");
        return true;
      } else {
        const txt = await response.text();
        toast.error("Invalid OpenAI Key: " + response.status + " " + txt);
        return false;
      }
    }
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      toast.error("Invalid OpenAI Key: " + error.message);
    } else {
      toast.error("Invalid OpenAI Key");
    }
    return false;
  }
};
