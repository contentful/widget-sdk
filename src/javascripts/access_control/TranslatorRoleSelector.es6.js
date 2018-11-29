import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

const ServicesConsumer = require('../reactServiceContext').default;

class TranslatorRoleSelector extends React.Component {
  static propTypes = {
    policies: PropTypes.shape().isRequired,
    hasFeatureEnabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    $services: PropTypes.shape().isRequired
  };

  render() {
    const {
      policies,
      hasFeatureEnabled,
      onChange,
      $services: { TheLocaleStore, CONFIG }
    } = this.props;

    const locales = [{ code: CONFIG.ALL_LOCALES, name: 'All locales' }].concat(
      TheLocaleStore.getPrivateLocales().map(({ code, name }) => ({
        code,
        name: `${name} (${code})`
      }))
    );

    const updateEntityPolicies = policies.entries.allowed
      .concat(policies.assets.allowed)
      .filter(({ action }) => action === 'update');

    const localCode = get(updateEntityPolicies[0], 'locale', locales[0].code);

    return (
      <div className="cfnext-form__field">
        <label htmlFor="opt_locale">Locale</label>
        <select className="cfnext-select-box" id="opt_locale" onChange={onChange} value={localCode}>
          {locales.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        {!hasFeatureEnabled && (
          <div className="cfnext-form__hint--normal-text">
            <div className="advice__note">
              For this built-in role, you can only specify the locale that users with this role can
              edit.
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default ServicesConsumer('TheLocaleStore', {
  from: 'PolicyBuilder/CONFIG',
  as: 'CONFIG'
})(TranslatorRoleSelector);
