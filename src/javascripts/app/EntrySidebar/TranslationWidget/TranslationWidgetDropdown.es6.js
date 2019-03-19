import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { keys, orderBy } from 'lodash';
import { Select, Option } from '@contentful/forma-36-react-components';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import { track } from 'analytics/Analytics.es6';
import { getModule } from 'NgRegistry.es6';

const TheLocaleStore = getModule('TheLocaleStore');

const TranslationWidgetDropdownValidationError = () => (
  <div className="entity-sidebar__error">
    <i className="cf-field-alert fa fa-exclamation-triangle" tooltip />
    <p>Use the dropdown to see which locales have validation errors.</p>
  </div>
);

export default class TranslationDropdownWidget extends Component {
  static propTypes = {
    emitter: PropTypes.shape({
      emit: PropTypes.func.isRequired
    }).isRequired,
    localeErrors: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.locales = TheLocaleStore.getLocales();
    this.state = {
      focusedLocaleCode: TheLocaleStore.getFocusedLocale().internal_code
    };
  }

  numErrors = code => {
    if (!this.props.localeErrors[code]) {
      return 0;
    }
    return this.props.localeErrors[code].length;
  };

  localeName = ({ internal_code: internalCode, code, name }) => {
    const baseName = `${name} (${code})`;
    const numErrors = this.numErrors(internalCode);
    return numErrors > 0
      ? `${baseName} - ${numErrors} ${numErrors > 1 ? 'errors' : 'error'}`
      : baseName;
  };

  hasError = () => {
    const localeCodes = keys(this.props.localeErrors);
    if (localeCodes.length === 0) {
      return false;
    } else if (localeCodes.length === 1 && localeCodes[0] === this.state.focusedLocaleCode) {
      // there is at least one locale error, but we don't want to display it
      // since it's for the locale we're already on
      return false;
    } else if (
      localeCodes.length === 1 &&
      localeCodes[0] === 'undefined' &&
      TheLocaleStore.getDefaultLocale().internal_code === this.state.focusedLocaleCode
    ) {
      // we're in the asset editor and on the default locale
      return false;
    } else {
      return true;
    }
  };

  handleChange = event => {
    const focusedLocaleCode = event.target.value;
    this.setState({ focusedLocaleCode });
    const newLocale = this.locales.find(l => l.internal_code === focusedLocaleCode);
    this.props.emitter.emit(SidebarEventTypes.UPDATED_FOCUSED_LOCALE, newLocale);
    track('translation_sidebar:change_focused_locale', { currentMode: 'single' });
  };

  render() {
    const hasError = this.hasError();
    return (
      <div>
        {hasError && <TranslationWidgetDropdownValidationError />}
        <Select
          id="optionSelect"
          onChange={this.handleChange}
          hasError={hasError}
          value={this.state.focusedLocaleCode}>
          {orderBy(this.locales, ['default', 'code'], ['desc', 'asc']).map(locale => (
            <Option key={locale.internal_code} value={locale.internal_code}>
              {this.localeName(locale)}
            </Option>
          ))}
        </Select>
      </div>
    );
  }
}
