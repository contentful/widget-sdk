import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { orderBy } from 'lodash';
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
      ? `${baseName} (${numErrors} ${numErrors > 1 ? 'errors' : 'error'})`
      : baseName;
  };

  handleChange = event => {
    const newLocale = event.target.value;
    TheLocaleStore.setCurrentLocale(newLocale);
    this.props.emitter.emit(SidebarEventTypes.UPDATED_CURRENT_LOCALE, newLocale);
  };

  componentWillUnmount = () => {
    TheLocaleStore.resetCurrentLocale();
  };

  render() {
    return (
      <EntrySidebarWidget testId="sidebar-translation-widget" title="Translation">
        <Select id="optionSelect" onChange={this.handleChange}>
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
