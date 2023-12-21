import { TabInfo } from "../types";
import { getServiceProvider } from "../utils";
import { fetchGemini } from "./gemini";
import { fetchGpt } from "./gpt";

const fetchMap = {
  GPT: fetchGpt,
  Gemini: fetchGemini,
};

export const fetchType = async (
  apiKey: string,
  tabInfo: TabInfo,
  types: string[]
) => {
  const serviceProvider = await getServiceProvider();
  if (!fetchMap[serviceProvider]) {
    throw new Error("unexpected serviceProvider: " + serviceProvider);
  }
  return fetchMap[serviceProvider](apiKey, tabInfo, types);
};
