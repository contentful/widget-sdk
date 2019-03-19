import React, { Component } from 'react';
import PropTypes from 'prop-types';
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

export default class TranslationSidebarWidget extends Component {
  static propTypes = {
    localeData: PropTypes.shape({
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

  render() {
    const { isSingleLocaleModeOn } = this.props.localeData;
    const CurrentTranslationWidget = isSingleLocaleModeOn
      ? TranslationWidgetDropdown
      : TranslationWidgetPills;

    const headerNode = (
      <Select
        value={isSingleLocaleModeOn ? Tab.SINGLE : Tab.MULTI}
        onChange={this.onSelectChange}
        width="auto"
        className="entity-sidebar__select">
        <Option value={Tab.MULTI}>Multiple locales</Option>
        <Option value={Tab.SINGLE}>Single locale</Option>
      </Select>
    );

    return (
      <EntrySidebarWidget
        testId="sidebar-translation-widget"
        title="Translation"
        headerNode={headerNode}>
        <CurrentTranslationWidget {...this.props} />
      </EntrySidebarWidget>
    );
  }
}
