import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

const moduleName = 'react/tabs-component';

angular.module('contentful')
.factory(moduleName, ['require', function () {
  const Tabs = createReactClass({
    propTypes: {
      active: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]),
      tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number
        ]),
        title: PropTypes.node,
        content: PropTypes.node
      })),
      onSelect: PropTypes.func
    },
    selectTab (tabId) {
      this.props.onSelect(tabId);
    },
    renderTabs () {
      const { active, tabs } = this.props;

      const tabsMarkup = tabs.map(tab => {
        const classNames = `${tab.id === active ? 'active' : ''}`;
        const onClick = this.selectTab.bind(this, tab.id);

        return (
          <div key={tab.id} className={classNames} onClick={onClick}>
            {tab.title}
          </div>
        );
      });

      return (
        <div>
          {tabsMarkup}
        </div>
      );
    },
    renderContent () {
      const { active, tabs } = this.props;

      const activeTab = tabs.find(tab => tab.id === active);

      return activeTab.content;
    },
    render () {
      return (
        <div>
          {this.renderTabs()}
          {this.renderContent()}
        </div>
      );
    }
  });

  return Tabs;
}]);

export const name = moduleName;
