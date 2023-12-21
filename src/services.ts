import { getStorage, matchesRule } from "./utils";
import { FilterRuleItem, TabInfo } from "./types";
import { fetchType } from "./service-provider";

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
