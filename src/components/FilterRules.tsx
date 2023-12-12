import { RuleType, FilterRuleItem } from "../types";

const ruleTypes: { label: string; value: RuleType }[] = [
  { label: "DOMAIN", value: "DOMAIN" },
  { label: "DOMAIN-SUFFIX", value: "DOMAIN-SUFFIX" },
  { label: "DOMAIN-KEYWORD", value: "DOMAIN-KEYWORD" },
];

type FilterRuleItemProps = {
  id: number;
  handleRuleChange: (id: number, rule: string) => void;
  handleTypeChange: (id: number, type: RuleType) => void;
  handleRuleDelete: (id: number) => void;
  ruleItem: FilterRuleItem;
};

const FilterRuleItem = ({
  id,
  handleRuleChange,
  handleTypeChange,
  ruleItem,
  handleRuleDelete,
}: FilterRuleItemProps) => {
  return (
    <div className="flex items-center space-x-4 my-2">
      <select
        className="bg-gray-50 border w-64 border-gray-300 text-gray-900 text-sm rounded-lg
        focus:ring-blue-500 focus:border-blue-500 block"
        value={ruleItem.type}
        onChange={(e) => handleTypeChange(id, e.target.value as RuleType)}
      >
        {ruleTypes.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        className="bg-gray-50 border w-64 border-gray-300 text-gray-900 text-sm rounded-lg
        focus:ring-blue-500 focus:border-blue-500 block"
        placeholder={`输入${ruleItem.type}`}
        value={ruleItem.rule}
        onChange={(e) => handleRuleChange(id, e.target.value)}
      />
      <button onClick={() => handleRuleDelete(id)}>Delete</button>
    </div>
  );
};

type FilterRulesProps = {
  filterRules: FilterRuleItem[];
  updateFilterRules: (rules: FilterRuleItem[]) => void;
};

const FilterRules = ({ filterRules, updateFilterRules }: FilterRulesProps) => {
  const handleAddItem = () => {
    updateFilterRules([
      ...filterRules,
      { id: filterRules.length, type: "DOMAIN", rule: "" },
    ]);
  };

  const handleRuleChange: FilterRuleItemProps["handleRuleChange"] = (
    id,
    newRule
  ) => {
    updateFilterRules(
      filterRules.map((item) =>
        item.id === id ? { ...item, rule: newRule } : item
      )
    );
  };

  const handleTypeChange: FilterRuleItemProps["handleTypeChange"] = (
    id,
    newType
  ) => {
    updateFilterRules(
      filterRules.map((item) =>
        item.id === id ? { ...item, type: newType } : item
      )
    );
  };
  const handleRuleDelete: FilterRuleItemProps["handleRuleDelete"] = (id) => {
    updateFilterRules(filterRules.filter((item) => item.id !== id));
  };

  return (
    <div>
      {filterRules.map((item) => (
        <FilterRuleItem
          key={item.id}
          id={item.id}
          handleRuleChange={handleRuleChange}
          handleTypeChange={handleTypeChange}
          handleRuleDelete={handleRuleDelete}
          ruleItem={item}
        />
      ))}

      <button
        className="rounded-md w-fit bg-primary/lg px-2.5 py-1.5 text-sm font-semibold
            text-white shadow-sm hover:bg-primary focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 disabled:bg-primary/sm"
        onClick={handleAddItem}
      >
        Add
      </button>
    </div>
  );
};

export default FilterRules;
