import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TranslationWidgetPills from './TranslationWidgetPills.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import TranslationDropdownWidget from '../TranslationDropdownWidget/TranslationDropdownWidget.es6';

const Tab = {
  multi: 'MULTI',
  single: 'SINGLE'
};

export default class TranslationSidebarWidget extends Component {
  static propTypes = {
    locales: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string.isRequired,
        default: PropTypes.bool.isRequired
      })
    ).isRequired,
    onChange: PropTypes.func.isRequired,
    onLocaleDeactivation: PropTypes.func.isRequired
  };

  state = {
    activeTab: Tab.multi
  };

  render() {
    const tabs = [
      {
        title: 'Multi',
        onClick: () => {
          this.setState({ activeTab: Tab.multi });
        }
      },
      {
        title: 'Single',
        onClick: () => {
          this.setState({ activeTab: Tab.single });
        }
      }
    ];
    const CurrentTranslationWidget =
      this.state.activeTab === Tab.multi ? TranslationWidgetPills : TranslationDropdownWidget;
    return (
      <EntrySidebarWidget testId="sidebar-translation-widget" title="Translation" tabs={tabs}>
        <CurrentTranslationWidget {...this.props} />
      </EntrySidebarWidget>
    );
  }
}
