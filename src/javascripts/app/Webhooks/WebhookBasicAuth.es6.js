import React from 'react';
import PropTypes from 'prop-types';

export default function WebhookBasicAuth({ httpBasicUsername, onChange }) {
  const shouldHide = typeof httpBasicUsername !== 'string' || httpBasicUsername.length < 1;

  return shouldHide ? null : (
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
      <p className="entity-editor__field-hint">
        If HTTP basic auth credentials are provided we will automatically set{' '}
        <code>Authorization: Basic...</code> header on all webhook calls. This overrides{' '}
        <code>Authorization</code> custom header if defined.
      </p>
    </div>
  );
}

WebhookBasicAuth.propTypes = {
  httpBasicUsername: PropTypes.string,
  onChange: PropTypes.func.isRequired
};
