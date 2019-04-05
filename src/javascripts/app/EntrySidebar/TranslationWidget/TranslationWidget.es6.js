import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import TranslationWidgetPills from './TranslationWidgetPills.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import TranslationWidgetDropdown from './TranslationWidgetDropdown.es6';
import { Select, Option } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics.es6';

const Tab = {
  MULTI: 'multiple',
  SINGLE: 'single'
};

const selectStyles = css({
  '& select': {
    backgroundColor: 'transparent',
    textAlignLast: 'right',
    border: '0',
    padding: `0 ${tokens.spacingL} 0 0`,
    height: tokens.spacingL
  },
  '& select:focus': {
    border: 0,
    boxShadow: 'none'
  },
  '& svg': {
    right: 0
  }
});

export default class TranslationSidebarWidget extends Component {
  static propTypes = {
    localeData: PropTypes.shape({
      isSingleLocaleModeSupported: PropTypes.bool.isRequired,
      isSingleLocaleModeOn: PropTypes.bool.isRequired
    }).isRequired,
    emitter: PropTypes.shape({
      emit: PropTypes.func.isRequired
    }).isRequired
  };

  onSelectChange = event => {
    const {
      target: { value }
    } = event;
    this.props.emitter.emit(SidebarEventTypes.SET_SINGLE_LOCALE_MODE, value === Tab.SINGLE);
    track('translation_sidebar:toggle_widget_mode', { currentMode: value });
  };

  headerNode = () => (
    <Select
      value={this.props.localeData.isSingleLocaleModeOn ? Tab.SINGLE : Tab.MULTI}
      onChange={this.onSelectChange}
      width="auto"
      className={selectStyles}>
      <Option value={Tab.MULTI}>Multiple locales</Option>
      <Option value={Tab.SINGLE}>Single locale</Option>
    </Select>
  );

  render() {
    const { isSingleLocaleModeSupported, isSingleLocaleModeOn } = this.props.localeData;
    const CurrentTranslationWidget =
      isSingleLocaleModeSupported && isSingleLocaleModeOn
        ? TranslationWidgetDropdown
        : TranslationWidgetPills;

    return (
      <EntrySidebarWidget
        testId="sidebar-translation-widget"
        title="Translation"
        headerNode={isSingleLocaleModeSupported ? this.headerNode() : undefined}>
        <CurrentTranslationWidget {...this.props} />
      </EntrySidebarWidget>
    );
  }
}
