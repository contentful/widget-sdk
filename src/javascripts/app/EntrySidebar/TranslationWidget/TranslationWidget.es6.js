import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TranslationWidgetPills from './TranslationWidgetPills.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import TranslationDropdownWidget from '../TranslationDropdownWidget/TranslationDropdownWidget.es6';
import { Select, Option } from '@contentful/forma-36-react-components';

const Tab = {
  MULTI: 'MULTI',
  SINGLE: 'SINGLE'
};

export default class TranslationSidebarWidget extends Component {
  static propTypes = {
    locales: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string.isRequired,
        default: PropTypes.bool.isRequired
      })
    ).isRequired,
    emitter: PropTypes.shape({
      emit: PropTypes.func.isRequired
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    onLocaleDeactivation: PropTypes.func.isRequired
  };

  state = {
    activeTab: Tab.multi
  };

  onTabChange = event => {
    const {
      target: { value }
    } = event;
    this.props.emitter.emit(SidebarEventTypes.SET_SINGLE_LOCALE_MODE, value === Tab.SINGLE);
    this.setState({ activeTab: value });
  };

  render() {
    const CurrentTranslationWidget =
      this.state.activeTab === Tab.MULTI ? TranslationWidgetPills : TranslationDropdownWidget;

    const select = (
      <Select onChange={this.onTabChange} width="auto" className="entity-sidebar__select">
        <Option value={Tab.MULTI}>Multiple locales</Option>
        <Option value={Tab.SINGLE}>Single locale</Option>
      </Select>
    );

    return (
      <EntrySidebarWidget testId="sidebar-translation-widget" title="Translation" select={select}>
        <CurrentTranslationWidget {...this.props} />
      </EntrySidebarWidget>
    );
  }
}
