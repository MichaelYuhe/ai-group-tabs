export type RuleType = "DOMAIN" | "DOMAIN-SUFFIX" | "DOMAIN-KEYWORD" | "REGEX";

export type FilterRuleItem = {
  id: number;
  type: RuleType;
  rule: string;
};
