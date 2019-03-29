import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { keys } from 'lodash';
import { orderLocales } from 'app/EntrySidebar/TranslationWidget/helpers.es6';
import { Select, Option } from '@contentful/forma-36-react-components';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import { track } from 'analytics/Analytics.es6';

const TranslationWidgetDropdownValidationError = () => (
  <div className="entity-sidebar__error">
    <i className="cf-field-alert fa fa-exclamation-triangle" />
    <p>Use the dropdown to see which locales have validation errors.</p>
  </div>
);

export default class TranslationDropdownWidget extends Component {
  static propTypes = {
    emitter: PropTypes.shape({
      emit: PropTypes.func.isRequired
    }).isRequired,
    localeData: PropTypes.shape({
      privateLocales: PropTypes.arrayOf(
        PropTypes.shape({
          internal_code: PropTypes.string.isRequired,
          default: PropTypes.bool.isRequired
        }).isRequired
      ).isRequired,
      errors: PropTypes.object.isRequired,
      focusedLocale: PropTypes.shape({
        internal_code: PropTypes.string.isRequired
      }).isRequired
    }).isRequired
  };

  numErrors = code => {
    if (!this.props.localeData.errors[code]) {
      return 0;
    }
    return this.props.localeData.errors[code].length;
  };

  localeName = ({ internal_code: internalCode, code, name }) => {
    const baseName = `${name} (${code})`;
    const numErrors = this.numErrors(internalCode);
    return numErrors > 0
      ? `${baseName} - ${numErrors} ${numErrors > 1 ? 'errors' : 'error'}`
      : baseName;
  };

  hasError = () => {
    const {
      errors: localeErrors,
      focusedLocale: { internal_code: focusedLocaleCode }
    } = this.props.localeData;
    const localeCodes = keys(localeErrors);
    if (
      localeCodes.length === 0 ||
      (localeCodes.length === 1 && localeCodes[0] === focusedLocaleCode)
    ) {
      // either there are no locale errors, or the locale errors are for the
      // locale we are currently on hence we don't want to display them
      return false;
    } else {
      return true;
    }
  };

  handleChange = event => {
    const focusedLocaleCode = event.target.value;
    const newLocale = this.props.localeData.privateLocales.find(locale => {
      return locale.internal_code === focusedLocaleCode;
    });
    this.props.emitter.emit(SidebarEventTypes.UPDATED_FOCUSED_LOCALE, newLocale);
    track('translation_sidebar:change_focused_locale', { currentMode: 'single' });
  };

  render() {
    const {
      privateLocales,
      focusedLocale: { internal_code: focusedLocaleCode }
    } = this.props.localeData;
    const hasError = this.hasError();
    return (
      <div>
        {hasError && <TranslationWidgetDropdownValidationError />}
        <Select
          id="optionSelect"
          onChange={this.handleChange}
          hasError={hasError}
          value={focusedLocaleCode}>
          {orderLocales(privateLocales).map(locale => (
            <Option key={locale.internal_code} value={locale.internal_code}>
              {this.localeName(locale)}
            </Option>
          ))}
        </Select>
      </div>
    );
  }
}
