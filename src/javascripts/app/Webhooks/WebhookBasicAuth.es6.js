import React from 'react';
import PropTypes from 'prop-types';

const isNonEmptyString = s => typeof s === 'string' && s.length > 0;
const nullifyEmpty = s => (isNonEmptyString(s) ? s : null);

const hint = (
  <p className="entity-editor__field-hint">
    If HTTP basic auth credentials are provided we will automatically set{' '}
    <code>Authorization: Basic...</code> header on all webhook calls. This overrides{' '}
    <code>Authorization</code> custom header if defined.
  </p>
);

export default class WebhookBasicAuth extends React.Component {
  static propTypes = {
    httpBasicUsername: PropTypes.string,
    httpBasicPassword: PropTypes.string,
    hasHttpBasicStored: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
  };

  render() {
    const { httpBasicUsername, httpBasicPassword, hasHttpBasicStored, onChange } = this.props;

    if (hasHttpBasicStored && isNonEmptyString(httpBasicUsername)) {
      return (
        <div className="cfnext-form__field">
          <label>HTTP basic auth</label>
          <div className="webhook-editor__settings-row">
            <div>
              Credentials for user <strong>{httpBasicUsername}</strong> stored.
            </div>
            <button
              className="btn-link"
              onClick={() => onChange({ httpBasicUsername: null, httpBasicPassword: null })}>
              Remove credentials
            </button>
          </div>
          {hint}
        </div>
      );
    } else {
      return (
        <div className="cfnext-form__field">
          <label htmlFor="webhook-basic-user">HTTP basic auth</label>
          <div className="webhook-editor__settings-row">
            <input
              type="text"
              className="cfnext-form__input"
              id="webhook-basic-user"
              placeholder="Username"
              value={httpBasicUsername || ''}
              onChange={e => onChange({ httpBasicUsername: nullifyEmpty(e.target.value) })}
            />
            <input
              type="password"
              className="cfnext-form__input"
              placeholder="Password"
              value={httpBasicPassword || ''}
              onChange={e => onChange({ httpBasicPassword: nullifyEmpty(e.target.value) })}
            />
          </div>
          {hint}
        </div>
      );
    }
  }
}
