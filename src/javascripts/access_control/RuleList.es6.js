import React from 'react';
import PropTypes from 'prop-types';

import Rule from 'access_control/Rule.es6';

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
    entity: PropTypes.string.isRequired
  };

  render() {
    const {
      isDisabled,
      entity,
      onUpdateRuleAttribute,
      onAddRule,
      rules,
      onRemoveRule
    } = this.props;

    return (
      <div className="rule-list" data-test-id={`rule-list-${entity}`}>
        <div className="rule-list__section">
          <label>Users with this role can:</label>
          {rules.allowed.length === 0 && (
            <div className="rule-list__note note-box note-box--info">
              <span>Currently, everything is denied for this role. </span>
              {!isDisabled && (
                <span>To allow certain actions add a rule by clicking the link below.</span>
              )}
            </div>
          )}
          {rules.allowed.map(rule => (
            <Rule
              key={rule.id}
              rule={rule}
              onUpdateAttribute={onUpdateRuleAttribute('allowed', rule.id)}
              onRemove={onRemoveRule('allowed', rule.id)}
              entity={entity}
              isDisabled={isDisabled}
            />
          ))}
          {!isDisabled && (
            <a
              className="rule-list__add"
              data-test-id="add-allowed-rule"
              onClick={onAddRule('allowed')}>
              {rules.allowed.length > 0 ? 'Add another rule' : 'Add a rule'}
            </a>
          )}
        </div>
        {rules.allowed.length > 0 && (
          <div className="rule-list__section">
            <label>
              Users with this role can
              <strong> not</strong>:
            </label>
            {!(rules.denied.length > 0 || isDisabled) && (
              <div className="rule-list__note note-box note-box--info">
                <span>
                  You can add exceptions to the rules you defined above. Add an exception by
                  clicking on the link below.
                </span>
              </div>
            )}
            <div className="rule-list__rule">
              {rules.denied.map(rule => (
                <Rule
                  key={rule.id}
                  rule={rule}
                  onUpdateAttribute={onUpdateRuleAttribute('denied', rule.id)}
                  onRemove={onRemoveRule('denied', rule.id)}
                  entity={entity}
                  isDisabled={isDisabled}
                />
              ))}
            </div>
            {!isDisabled && (
              <a
                className="rule-list__add"
                data-test-id="add-denied-rule"
                onClick={onAddRule('denied')}>
                {rules.denied.length > 0 ? 'Add another exception' : 'Add an exception'}
              </a>
            )}
          </div>
        )}
      </div>
    );
  }
}
