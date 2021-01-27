export interface RuleInterface {
  name: string;
  id: string;
  contentType: string;
  action: string;
  scope: string;
  entityId: string;
  field: string;
  locale: string;
}

type MissingRuleAttribute = 'contentType' | 'field' | 'entry' | 'asset' | 'locale' | 'tags';

export type IncompleteRulesList = {
  [ruleId: string]: MissingRuleAttribute[];
};
