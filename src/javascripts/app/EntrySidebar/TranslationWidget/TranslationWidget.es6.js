import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { orderBy, keys } from 'lodash';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import { Select, Option } from '@contentful/forma-36-react-components';
import { getModule } from 'NgRegistry.es6';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';

const TheLocaleStore = getModule('TheLocaleStore');

export default class TranslationSidebarWidget extends Component {
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
      currentLocaleCode: TheLocaleStore.getCurrentLocale().internal_code
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
    } else if (localeCodes.length === 1 && localeCodes[0] === this.state.currentLocaleCode) {
      // there is at least one locale error, but we don't want to display it
      // since it's for the locale we're already on.
      return false;
    } else if (
      localeCodes.length === 1 &&
      localeCodes[0] === 'undefined' &&
      TheLocaleStore.getDefaultLocale().internal_code === this.state.currentLocaleCode
    ) {
      // we're in the asset editor and on the default locale. (HACK!)
      return false;
    } else {
      return true;
    }
  };

  setCurrentLocale = newLocaleCode => {
    this.setState({ currentLocaleCode: newLocaleCode });
    const newLocale = this.locales.find(l => l.internal_code === newLocaleCode);
    TheLocaleStore.setCurrentLocale(newLocale);
  };

  handleChange = event => {
    const newLocale = event.target.value;
    this.setCurrentLocale(newLocale);
    this.props.emitter.emit(SidebarEventTypes.UPDATED_CURRENT_LOCALE, newLocale);
  };

  componentWillUnmount = () => {
    TheLocaleStore.resetCurrentLocale();
  };

  render() {
    return (
      <EntrySidebarWidget testId="sidebar-translation-widget" title="Translation">
        <Select id="optionSelect" onChange={this.handleChange} hasError={this.hasError()}>
          {orderBy(this.locales, ['default', 'code'], ['desc', 'asc']).map(locale => (
            <Option key={locale.code} value={locale.code}>
              {this.localeName(locale)}
            </Option>
          ))}
        </Select>
      </EntrySidebarWidget>
    );
  }
}
