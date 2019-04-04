import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { orderBy } from 'lodash';
import { Select, Option } from '@contentful/forma-36-react-components';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import { truncate } from 'utils/StringUtils.es6';
import { track } from 'analytics/Analytics.es6';

const sortLocales = locales => orderBy(locales, ['default', 'name'], ['desc', 'asc']);

export default class TranslationDropdownWidget extends Component {
  static propTypes = {
    emitter: PropTypes.shape({
      emit: PropTypes.func.isRequired
    }).isRequired,
    localeData: PropTypes.shape({
      privateLocales: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          code: PropTypes.string.isRequired,
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
    const numErrors = this.numErrors(internalCode);
    if (numErrors > 0) {
      const errors = numErrors > 1 ? 'errors' : 'error';
      return `${truncate(name, 20)} (${code}) - ${numErrors} ${errors}`;
    } else {
      return `${name} (${code})`;
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
    return (
      <div>
        <Select id="optionSelect" onChange={this.handleChange} value={focusedLocaleCode}>
          {sortLocales(privateLocales).map(locale => (
            <Option key={locale.internal_code} value={locale.internal_code}>
              {this.localeName(locale)}
            </Option>
          ))}
        </Select>
      </div>
    );
  }
}
