import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { orderBy, keys } from 'lodash';
import { Select, Option } from '@contentful/forma-36-react-components';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import { track } from 'analytics/Analytics.es6';
import { getModule } from 'NgRegistry.es6';

const TheLocaleStore = getModule('TheLocaleStore');

export default class TranslationDropdownWidget extends Component {
  static propTypes = {
    emitter: PropTypes.shape({
      emit: PropTypes.func.isRequired
    }).isRequired,
    localeErrors: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.locales = TheLocaleStore.getLocales();
    this.state = {
      focusedLocaleCode: TheLocaleStore.getFocusedLocale().internal_code
    };
  }

  numErrors = code => {
    if (!this.props.localeErrors || !this.props.localeErrors[code]) {
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
      // since it's for the locale we're already on.
      return false;
    } else if (
      localeCodes.length === 1 &&
      localeCodes[0] === 'undefined' &&
      TheLocaleStore.getDefaultLocale().internal_code === this.state.focusedLocaleCode
    ) {
      // we're in the asset editor and on the default locale. (HACK!)
      return false;
    } else {
      return true;
    }
  };

  handleChange = event => {
    const localeCode = event.target.value;
    this.setState({ focusedLocaleCode: localeCode });
    const newLocale = this.locales.find(l => l.code === localeCode);
    this.props.emitter.emit(SidebarEventTypes.UPDATED_FOCUSED_LOCALE, newLocale);
    track('translation_sidebar:change_focused_locale', { currentMode: 'single' });
  };

  render() {
    return (
      <Select
        id="optionSelect"
        onChange={this.handleChange}
        hasError={this.hasError()}
        value={this.state.focusedLocaleCode}>
        {orderBy(this.locales, ['default', 'code'], ['desc', 'asc']).map(locale => (
          <Option key={locale.code} value={locale.code}>
            {this.localeName(locale)}
          </Option>
        ))}
      </Select>
    );
  }
}
