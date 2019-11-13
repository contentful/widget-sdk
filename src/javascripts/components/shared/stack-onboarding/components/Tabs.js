import React from 'react';
import PropTypes from 'prop-types';

class Tabs extends React.Component {
  static propTypes = {
    active: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tabs: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.node,
        content: PropTypes.node
      })
    ),
    onSelect: PropTypes.func,
    className: PropTypes.string
  };

  selectTab = tabId => {
    this.props.onSelect(tabId);
  };

  renderTabs = () => {
    const { active, tabs, className } = this.props;

    const tabsMarkup = tabs.map(tab => {
      const onClick = this.selectTab.bind(this, tab.id);
      return (
        <li key={tab.id} role={'tab'} aria-selected={tab.id === active} onClick={onClick}>
          {tab.title}
        </li>
      );
    });

    return <ul className={`tab-list ${className || ''}`}>{tabsMarkup}</ul>;
  };

  renderContent = () => {
    const { active, tabs } = this.props;

    const activeTab = tabs.find(tab => tab.id === active);

    return activeTab.content;
  };

  render() {
    return (
      <div>
        {this.renderTabs()}
        {this.renderContent()}
      </div>
    );
  }
}

export default Tabs;
