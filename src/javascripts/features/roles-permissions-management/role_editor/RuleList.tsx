import {
  Button,
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
import { useCallback, useMemo } from 'react';
import { SelectPill } from '../components/SelectPill';
import { RuleInterface } from 'features/roles-permissions-management/@types';

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
  filters: { action: string; scope: string; contentType: string }
) => {
  allowed: RuleInterface[];
  denied: RuleInterface[];
} = (rules, filters) => {
  const filterByFilterCriteria = (rule) =>
    (rule.action === filters.action || filters.action === 'clean') &&
    (rule.scope === filters.scope || filters.scope === 'clean') &&
    (rule.contentType === filters.contentType || filters.contentType === 'clean');

  return {
    allowed: rules.allowed.filter(filterByFilterCriteria),
    denied: rules.denied.filter(filterByFilterCriteria),
  };
};

interface RuleListProps {
  rules: {
    allowed: RuleInterface[];
    denied: RuleInterface[];
  };
  onAddRule: (rulesKey: string) => () => void;
  onRemoveRule: (rulesKey: string, id: string) => void;
  onUpdateRuleAttribute: (rulesKey: string, id: string) => void;
  isDisabled: boolean;
  entity: string;
  privateLocales: any[];
  contentTypes: any[];
  searchEntities: () => void;
  getEntityTitle: () => void;
  hasClpFeature: boolean;
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
  } = props;
  const [actionFilter, setActionFilter] = React.useState('clean');
  const [scopeFilter, setScopeFilter] = React.useState('clean');
  const [contentTypeFilter, setContentTypeFilter] = React.useState('clean');

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
    (ruleType: 'denied' | 'allowed') => {
      onAddRule(ruleType)();
      resetFilters();
    },
    [onAddRule, resetFilters]
  );

  const filteredRules = useMemo(
    () =>
      filterRules(rules, {
        action: actionFilter,
        scope: scopeFilter,
        contentType: contentTypeFilter,
      }),
    [rules, actionFilter, scopeFilter, contentTypeFilter]
  );

  const hasRules = rules.allowed.length;
  const activeFilter =
    actionFilter !== 'clean' || scopeFilter !== 'clean' || contentTypeFilter !== 'clean';

  const entityName = getEntityName(entity);

  return (
    <div className="rule-list" data-test-id={`rule-list-${entity}`}>
      <div className="rule-list__section" data-test-id={`rule-list-${entity}-section`}>
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
        <Heading>{hasRules ? 'Allowed' : 'Everything is denied for this rule.'}</Heading>
        <Paragraph className={hasRules ? undefined : styles.addLink}>
          {hasRules
            ? 'Users with this role can:'
            : "Users with this role can't do anything. Add a rule to allow certain actions."}
        </Paragraph>
        {filteredRules.allowed.map((rule) => (
          <Rule
            key={rule.id}
            rule={rule}
            onUpdateAttribute={onUpdateRuleAttribute('allowed', rule.id)}
            onRemove={onRemoveRule('allowed', rule.id)}
            entity={entity}
            isDisabled={isDisabled}
            privateLocales={privateLocales}
            contentTypes={contentTypes}
            searchEntities={searchEntities}
            getEntityTitle={getEntityTitle}
            hasClpFeature={hasClpFeature}
          />
        ))}
        {!isDisabled && (
          <Button
            className={styles.addLink}
            testId="add-allowed-rule"
            onClick={() => addRuleAndResetFilters('allowed')}>
            {rules.allowed.length > 0 ? 'Add another rule' : 'Add a rule'}
          </Button>
        )}
      </div>
      {rules.allowed.length > 0 && (
        <div className="rule-list__section">
          <Heading>Denied</Heading>
          <Paragraph className={rules.denied.length ? undefined : styles.addLink}>
            Users with this role can
            <strong> not</strong>:
          </Paragraph>
          <div className="rule-list__rule" data-test-id="rule-exceptions">
            {filteredRules.denied.map((rule) => (
              <Rule
                key={rule.id}
                rule={rule}
                onUpdateAttribute={onUpdateRuleAttribute('denied', rule.id)}
                onRemove={onRemoveRule('denied', rule.id)}
                entity={entity}
                isDisabled={isDisabled}
                privateLocales={privateLocales}
                contentTypes={contentTypes}
                searchEntities={searchEntities}
                getEntityTitle={getEntityTitle}
                hasClpFeature={hasClpFeature}
              />
            ))}
          </div>
          {!isDisabled && (
            <Button
              className={styles.addLink}
              testId="add-denied-rule"
              onClick={() => addRuleAndResetFilters('denied')}>
              {rules.denied.length > 0 ? 'Add another exception' : 'Add an exception'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export { RuleList };
