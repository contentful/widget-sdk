import { Button, Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import React from 'react';
import { Rule } from './Rule';

const styles = {
  note: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
  addLink: css({
    marginBottom: tokens.spacingL,
  }),
};

const RulesPropType = PropTypes.arrayOf(
  PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })
);

export class RuleList extends React.Component {
  static propTypes = {
    rules: PropTypes.shape({
      allowed: RulesPropType.isRequired,
      denied: RulesPropType.isRequired,
    }).isRequired,
    onAddRule: PropTypes.func.isRequired,
    onRemoveRule: PropTypes.func.isRequired,
    onUpdateRuleAttribute: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool.isRequired,
    entity: PropTypes.string.isRequired,
    privateLocales: PropTypes.array.isRequired,
    contentTypes: PropTypes.array.isRequired,
    searchEntities: PropTypes.func.isRequired,
    getEntityTitle: PropTypes.func.isRequired,
    hasClpFeature: PropTypes.bool,
  };

  render() {
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
    } = this.props;

    const hasRules = rules.allowed.length;

    return (
      <div className="rule-list" data-test-id={`rule-list-${entity}`}>
        <div className="rule-list__section" data-test-id={`rule-list-${entity}-section`}>
          <Heading>{hasRules ? 'Allowed' : 'Everything is denied for this rule.'}</Heading>
          <Paragraph className={hasRules ? null : styles.addLink}>
            {hasRules
              ? 'Users with this role can:'
              : "Users with this role can't do anything. Add a rule to allow certain actions."}
          </Paragraph>
          {rules.allowed.map((rule) => (
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
              onClick={onAddRule('allowed')}>
              {rules.allowed.length > 0 ? 'Add another rule' : 'Add a rule'}
            </Button>
          )}
        </div>
        {rules.allowed.length > 0 && (
          <div className="rule-list__section">
            <Heading>Denied</Heading>
            <Paragraph className={rules.denied.length ? null : styles.addLink}>
              Users with this role can
              <strong> not</strong>:
            </Paragraph>
            <div className="rule-list__rule" data-test-id="rule-exceptions">
              {rules.denied.map((rule) => (
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
                onClick={onAddRule('denied')}>
                {rules.denied.length > 0 ? 'Add another exception' : 'Add an exception'}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
}
