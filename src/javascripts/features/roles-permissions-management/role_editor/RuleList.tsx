import {
  Button,
  Card,
  Heading,
  Paragraph,
  Option,
  TextLink,
  Subheading,
} from '@contentful/forma-36-react-components';

import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import * as React from 'react';
import { actionsOptions, contentTypesToOptions, Rule } from './Rule';
import { useCallback, useMemo, useState } from 'react';
import { SelectPill } from '../components/SelectPill';
import { RuleInterface, IncompleteRulesList } from 'features/roles-permissions-management/@types';

const styles = {
  note: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
  addLink: css({
    marginBottom: tokens.spacingL,
  }),
  filtersContainer: css({
    display: 'flex',
    margin: `${tokens.spacingS} 0 ${tokens.spacingM}`,
  }),
  selectFilter: css({
    marginLeft: tokens.spacing2Xs,
  }),
  clearFilters: css({
    marginLeft: tokens.spacingM,
    textDecoration: 'none',
  }),
  warning: css({
    color: tokens.colorNegative,
    marginBottom: tokens.spacingS,
  }),
  incompleteSection: css({
    marginBottom: tokens.spacingM,
  }),
};

export const getEntityName = (entity) => {
  if (entity === 'entry') {
    return ['Entry', 'Entries'];
  } else {
    return ['Asset', 'Assets'];
  }
};

const filterRules: (
  rules: { allowed: RuleInterface[]; denied: RuleInterface[] },
  incompleteRulesList: IncompleteRulesList,
  filters: { action: string; scope: string; contentType: string }
) => {
  allowed: { incomplete: RuleInterface[]; complete: RuleInterface[] };
  denied: { incomplete: RuleInterface[]; complete: RuleInterface[] };
} = (rules, incompleteRulesList, filters) => {
  const filterByFilterCriteria = (rule) =>
    (rule.action === filters.action || filters.action === 'clean') &&
    (rule.scope === filters.scope ||
      filters.scope === 'clean' ||
      (filters.scope === 'any' && rule.scope === 'metadataTagIds')) &&
    (rule.contentType === filters.contentType || filters.contentType === 'clean');

  const splitCompleteAndIncomplete = (rules) => {
    const complete: RuleInterface[] = [];
    const incomplete: RuleInterface[] = [];
    for (let i = 0; i < rules.length; i++) {
      if (incompleteRulesList[rules[i].id]) {
        incomplete.push(rules[i]);
      } else {
        complete.push(rules[i]);
      }
    }
    return { complete, incomplete };
  };

  return {
    allowed: splitCompleteAndIncomplete(rules.allowed.filter(filterByFilterCriteria)),
    denied: splitCompleteAndIncomplete(rules.denied.filter(filterByFilterCriteria)),
  };
};

type RuleType = 'denied' | 'allowed';

interface RuleListProps {
  rules: {
    allowed: RuleInterface[];
    denied: RuleInterface[];
  };
  onAddRule: (rulesKey: string) => () => string;
  onRemoveRule: (rulesKey: string, id: string) => () => void;
  onUpdateRuleAttribute: (
    rulesKey: string,
    id: string
  ) => (attribute: string) => (event: React.ChangeEvent<{ value: string }>) => void;
  isDisabled: boolean;
  entity: string;
  privateLocales: any[];
  contentTypes: any[];
  searchEntities: () => void;
  getEntityTitle: () => void;
  hasClpFeature: boolean;
  newRuleIds: string[];
  addNewRule: (ruleId: string) => void;
  removeNewRule: (ruleId: string) => void;
  editedRuleIds: string[];
  addEditedRule: (ruleId: string, field: string, initialValue: string, newValue: string) => void;
  incompleteRulesList: IncompleteRulesList;
}

const RuleList: React.FunctionComponent<RuleListProps> = (props) => {
  const {
    isDisabled,
    entity,
    onUpdateRuleAttribute,
    onAddRule,
    rules,
    onRemoveRule,
    privateLocales,
    contentTypes,
    searchEntities,
    getEntityTitle,
    hasClpFeature,
    newRuleIds,
    addNewRule,
    removeNewRule,
    editedRuleIds,
    addEditedRule,
    incompleteRulesList,
  } = props;
  const [actionFilter, setActionFilter] = useState('clean');
  const [scopeFilter, setScopeFilter] = useState('clean');
  const [contentTypeFilter, setContentTypeFilter] = useState('clean');
  const [scroll, setScroll] = useState(false);

  const resetFilters = useCallback(() => {
    setActionFilter('clean');
    setScopeFilter('clean');
    setContentTypeFilter('clean');
  }, [setActionFilter, setScopeFilter, setContentTypeFilter]);

  const filterActionOptions = [{ text: 'Actions (all)', value: 'clean' }, ...actionsOptions];
  const filterContentTypeOptions = [
    { name: 'Content Types (all)', id: 'clean' },
    ...contentTypesToOptions(contentTypes),
  ];

  const addRuleAndResetFilters = useCallback(
    (ruleType: RuleType) => {
      const draftRuleId = onAddRule(ruleType)();
      addNewRule(draftRuleId);
      resetFilters();
      setScroll(true);
    },
    [onAddRule, resetFilters, addNewRule]
  );

  const removeRule = useCallback(
    (ruleType: RuleType, ruleId) => {
      onRemoveRule(ruleType, ruleId)();
      removeNewRule(ruleId);
      setScroll(false);
    },
    [onRemoveRule, removeNewRule]
  );

  const updateRuleAttribute = useCallback(
    (ruleType: RuleType, ruleId) => (field, initialValue) => (
      event: React.ChangeEvent<{ value: string }>
    ) => {
      onUpdateRuleAttribute(ruleType, ruleId)(field)(event);
      addEditedRule(ruleId, field, initialValue, event.target.value);
      setScroll(false);
    },
    [onUpdateRuleAttribute, addEditedRule]
  );

  const filteredRules = useMemo(
    () =>
      filterRules(rules, incompleteRulesList, {
        action: actionFilter,
        scope: scopeFilter,
        contentType: contentTypeFilter,
      }),
    [rules, actionFilter, scopeFilter, contentTypeFilter, incompleteRulesList]
  );

  const hasRules = rules.allowed.length;
  const activeFilter =
    actionFilter !== 'clean' || scopeFilter !== 'clean' || contentTypeFilter !== 'clean';

  const entityName = getEntityName(entity);

  const renderRules = ({ complete, incomplete }, access: RuleType) => {
    const renderRuleWithAccess = (access) => (rule) => renderRule(rule, access);
    const result: React.ReactNode[] = [];
    if (incomplete.length) {
      result.push(
        <Card key={access} padding="large" className={styles.incompleteSection}>
          <Subheading className={styles.warning}>{`Incomplete ${access} rules`}</Subheading>
          <Paragraph>
            Some active rules are incomplete because they contain missing attributes. Those were
            either deleted or only exist in another environment.
          </Paragraph>
          <Paragraph>
            If these rules are no longer needed, delete them to prevent unwanted access.
          </Paragraph>
          {incomplete.map(renderRuleWithAccess(access))}
        </Card>
      );
    }
    result.push(complete.map(renderRuleWithAccess(access)));
    return <>{result}</>;
  };

  const renderRule = (rule, access) => {
    const isTheNewRule = newRuleIds.length > 0 && rule.id === newRuleIds[newRuleIds.length - 1];
    return (
      <Rule
        key={rule.id}
        rule={rule}
        onUpdateAttribute={updateRuleAttribute(access, rule.id)}
        onRemove={() => removeRule(access, rule.id)}
        entity={entity}
        isDisabled={isDisabled}
        privateLocales={privateLocales}
        contentTypes={contentTypes}
        searchEntities={searchEntities}
        getEntityTitle={getEntityTitle}
        hasClpFeature={hasClpFeature}
        focus={isTheNewRule && scroll}
        isNew={newRuleIds.includes(rule.id)}
        modified={editedRuleIds.includes(rule.id)}
        missing={incompleteRulesList[rule.id] || []}
      />
    );
  };

  return (
    <div className="rule-list" data-test-id={`rule-list-${entity}`}>
      <Subheading>Filter rules by</Subheading>
      <div className={styles.filtersContainer}>
        <SelectPill
          testId="rules-filter-action-select"
          isActive={actionFilter !== 'clean'}
          isDisabled={isDisabled}
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}>
          {filterActionOptions.map(({ value, text }) => (
            <Option value={value} key={value}>
              {text}
            </Option>
          ))}
        </SelectPill>

        <SelectPill
          testId="rules-filter-scope-select"
          isActive={scopeFilter !== 'clean'}
          isDisabled={isDisabled}
          value={scopeFilter}
          onChange={(event) => setScopeFilter(event.target.value)}>
          <Option value="clean">{`${entityName[1]} (all)`}</Option>
          <Option value="any">{`Any ${entityName[0].toLowerCase()}`}</Option>
          <Option value="user">{`${entityName[1]} created by user`}</Option>
          <Option value="entityId">{`A specific ${entityName[0].toLowerCase()}`}</Option>
        </SelectPill>
        {entity === 'entry' && (
          <SelectPill
            testId="rules-filter-content-type-select"
            isActive={contentTypeFilter !== 'clean'}
            isDisabled={isDisabled}
            value={contentTypeFilter}
            onChange={(event) => setContentTypeFilter(event.target.value)}>
            {filterContentTypeOptions.map(({ id, name }) => (
              <Option value={id} key={id}>
                {name}
              </Option>
            ))}
          </SelectPill>
        )}
        {activeFilter && (
          <TextLink
            className={styles.clearFilters}
            disabled={false}
            iconPosition="right"
            linkType="primary"
            testId="clear-filters"
            onClick={() => resetFilters()}>
            Clear filters
          </TextLink>
        )}
      </div>
      <div className="rule-list__section" data-test-id={`rule-list-${entity}-section`}>
        <Heading>{hasRules ? 'Allowed' : 'Everything is denied for this rule.'}</Heading>
        <Paragraph className={styles.addLink}>
          {hasRules
            ? 'Users with this role can:'
            : "Users with this role can't do anything. Add a rule to allow certain actions."}
        </Paragraph>
        <div className="rule-list__rule" data-test-id="rule-allowed">
          {renderRules(filteredRules.allowed, 'allowed')}
        </div>
        {!isDisabled && (
          <Button
            className={styles.addLink}
            testId="add-allowed-rule"
            onClick={() => addRuleAndResetFilters('allowed')}>
            New allow rule
          </Button>
        )}
      </div>
      {rules.allowed.length > 0 && (
        <div className="rule-list__section">
          <Heading>Denied</Heading>
          <Paragraph className={styles.addLink}>
            Users with this role can
            <strong> not</strong>:
          </Paragraph>
          <div className="rule-list__rule" data-test-id="rule-exceptions">
            {renderRules(filteredRules.denied, 'denied')}
          </div>
          {!isDisabled && (
            <Button
              className={styles.addLink}
              testId="add-denied-rule"
              onClick={() => addRuleAndResetFilters('denied')}>
              New deny rule
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export { RuleList };
