export type RuleType = "DOMAIN" | "DOMAIN-SUFFIX" | "DOMAIN-KEYWORD";

export type FilterRuleItem = {
  id: number;
  type: RuleType;
  rule: string;
};
