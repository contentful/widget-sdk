import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import Rule from './Rule';

const styles = {
  note: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM
  }),
  addLink: css({
    marginBottom: tokens.spacingL
  })
};

const RulesPropType = PropTypes.arrayOf(
  PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })
);

export default class RuleList extends React.Component {
  static propTypes = {
    rules: PropTypes.shape({
      allowed: RulesPropType.isRequired,
      denied: RulesPropType.isRequired
    }).isRequired,
    onAddRule: PropTypes.func.isRequired,
    onRemoveRule: PropTypes.func.isRequired,
    onUpdateRuleAttribute: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool.isRequired,
    entity: PropTypes.string.isRequired,
    privateLocales: PropTypes.array.isRequired,
    contentTypes: PropTypes.array.isRequired,
    searchEntities: PropTypes.func.isRequired,
    getEntityTitle: PropTypes.func.isRequired
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
      getEntityTitle
    } = this.props;

    return (
      <div className="rule-list" data-test-id={`rule-list-${entity}`}>
        <div className="rule-list__section" data-test-id={`rule-list-${entity}-section`}>
          <label>Users with this role can:</label>
          {rules.allowed.length === 0 && (
            <Note className={styles.note}>
              <span>Currently, everything is denied for this role. </span>
              {!isDisabled && (
                <span>To allow certain actions add a rule by clicking the link below.</span>
              )}
            </Note>
          )}
          {rules.allowed.map(rule => (
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
            />
          ))}
          {!isDisabled && (
            <TextLink
              className={styles.addLink}
              testId="add-allowed-rule"
              onClick={onAddRule('allowed')}>
              {rules.allowed.length > 0 ? 'Add another rule' : 'Add a rule'}
            </TextLink>
          )}
        </div>
        {rules.allowed.length > 0 && (
          <div className="rule-list__section">
            <label>
              Users with this role can
              <strong> not</strong>:
            </label>
            {!(rules.denied.length > 0 || isDisabled) && (
              <Note className={styles.note}>
                You can add exceptions to the rules you defined above. Add an exception by clicking
                on the link below.
              </Note>
            )}
            <div className="rule-list__rule" data-test-id="rule-exceptions">
              {rules.denied.map(rule => (
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
                />
              ))}
            </div>
            {!isDisabled && (
              <TextLink
                className={styles.addLink}
                testId="add-denied-rule"
                onClick={onAddRule('denied')}>
                {rules.denied.length > 0 ? 'Add another exception' : 'Add an exception'}
              </TextLink>
            )}
          </div>
        )}
      </div>
    );
  }
}
