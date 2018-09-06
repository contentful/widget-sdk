import React from 'react';
import PropTypes from 'prop-types';

export default function WebhookBasicAuth({ httpBasicUsername, onChange }) {
  const shouldHide = typeof httpBasicUsername !== 'string' || httpBasicUsername.length < 1;

  return shouldHide ? null : (
    <div className="cfnext-form__field">
      <label>HTTP Basic Auth</label>
      <div className="webhook-editor__settings-row">
        <div>
          Credentials for user <strong>{httpBasicUsername}</strong> stored.
        </div>
        <button
          className="btn-link"
          onClick={() => onChange({ httpBasicUsername: null, httpBasicPassword: null })}>
          Remove stored credentials
        </button>
      </div>
      <p className="entity-editor__field-hint">
        If HTTP Basic Auth credentials are provided we will automatically set{' '}
        <code>Authorization: Basic...</code> header on all webhook calls. This overrides{' '}
        <code>Authorization</code> custom header if defined.
      </p>
      <p className="entity-editor__field-hint">
        Please note setting HTTP Basic Auth credentials is deprecated. For new webhooks use the{' '}
        {'"Add HTTP Basic Auth header"'} option above. Consider removing HTTP Basic Auth credentials
        provided here and using the new, more secure option.
      </p>
    </div>
  );
}

WebhookBasicAuth.propTypes = {
  httpBasicUsername: PropTypes.string,
  onChange: PropTypes.func.isRequired
};
