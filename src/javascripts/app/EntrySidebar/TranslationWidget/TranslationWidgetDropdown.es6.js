import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { orderBy } from 'lodash';
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

  handleChange = event => {
    const focusedLocaleCode = event.target.value;
    this.setState({ focusedLocaleCode });
    const newLocale = this.locales.find(l => l.internal_code === focusedLocaleCode);
    this.props.emitter.emit(SidebarEventTypes.UPDATED_FOCUSED_LOCALE, newLocale);
    track('translation_sidebar:change_focused_locale', { currentMode: 'single' });
  };

  render() {
    return (
      <Select id="optionSelect" onChange={this.handleChange} value={this.state.focusedLocaleCode}>
        {orderBy(this.locales, ['default', 'code'], ['desc', 'asc']).map(locale => (
          <Option key={locale.internal_code} value={locale.internal_code}>
            {this.localeName(locale)}
          </Option>
        ))}
      </Select>
    );
  }
}
