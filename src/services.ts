import { getStorage, matchesRule } from "./utils";
import { FilterRuleItem, ServiceProvider, TabInfo } from "./types";
import { fetchType } from "./service-provider";
import { toast } from "./components/toast";

interface TabGroup {
  type: string;
  tabIds: (number | undefined)[];
}

const filterTabInfo = (tabInfo: TabInfo, filterRules: FilterRuleItem[]) => {
  if (!filterRules || !filterRules?.length) return true;
  const url = new URL(tabInfo.url ?? "");
  return !filterRules.some((rule) => {
    return matchesRule(url, rule);
  });
};

export async function batchGroupTabs(
  tabs: chrome.tabs.Tab[],
  types: string[],
  apiKey: string
) {
  const filterRules = (await getStorage<FilterRuleItem[]>("filterRules")) || [];
  const tabInfoList: TabInfo[] = tabs
    .map((tab) => {
      return {
        id: tab.id,
        title: tab.title,
        url: tab.url,
      };
    })
    .filter((tab) => filterTabInfo(tab, filterRules));

  const result: TabGroup[] = types.map((type) => {
    return {
      type,
      tabIds: [],
    };
  });

  try {
    await Promise.all(
      tabInfoList.map(async (tabInfo) => {
        if (!tabInfo.url) return;
        const type = await fetchType(apiKey, tabInfo, types);
        const index = types.indexOf(type);
        if (index === -1) return;
        result[index].tabIds.push(tabInfo.id);
      })
    );
    return result;
  } catch (error) {
    console.error(error);
    return result;
  }
}

export async function handleOneTab(
  tab: chrome.tabs.Tab,
  types: string[],
  apiKey: string
) {
  try {
    const tabInfo: TabInfo = { id: tab.id, title: tab.title, url: tab.url };
    const filterRules =
      (await getStorage<FilterRuleItem[]>("filterRules")) || [];
    const shouldFilter = !filterTabInfo(tabInfo, filterRules);
    if (shouldFilter) return;

    const type = await fetchType(apiKey, tabInfo, types);

    return type;
  } catch (error) {
    console.error(error);
  }
}

/**
 * This function will show a toast!
 */
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
