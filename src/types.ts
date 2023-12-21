export type RuleType = "DOMAIN" | "DOMAIN-SUFFIX" | "DOMAIN-KEYWORD" | "REGEX";

export type FilterRuleItem = {
  id: number;
  type: RuleType;
  rule: string;
};

export type ServiceProvider = "GPT" | "Gemini";

export interface TabInfo {
  id: number | undefined;
  title: string | undefined;
  url: string | undefined;
}
