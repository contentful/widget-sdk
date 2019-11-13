/* eslint-disable rulesdir/restrict-non-f36-components */

import React from 'react';
import PropTypes from 'prop-types';
import AccountDropdown from './AccountDropdown';
import QuickNavigation from 'components/shared/QuickNavigation/QuickNavWithFeatureFlag';
import OnboardingRelaunch from 'navigation/modernStackOnboardingRelaunch';
import NavigationItem from './NavigationItem';
import NavigationDropdown from './NavigationDropdown';

class NavigationList extends React.Component {
  render() {
    return (
      <ul className="nav-bar__list">
        {this.props.items.map(item => {
          if (item.children) {
            return <NavigationDropdown key={item.title} item={item} />;
          }
          return <NavigationItem key={item.title} item={item} />;
        })}
      </ul>
    );
  }
}

NavigationList.propTypes = {
  items: PropTypes.array.isRequired
};

export default class NavBar extends React.Component {
  render() {
    return (
      <div className="app-top-bar__child app-top-bar__child-wide">
        <div className="app-top-bar__inner-wrapper">
          <div className="app-top-bar__child app-top-bar__main-nav">
            <nav className="nav-bar">
              <NavigationList items={this.props.listItems} />
              <div className="nav-bar__end">
                {this.props.showModernStackOnboardingRelaunch && (
                  <div className="app-top-bar__child">
                    <OnboardingRelaunch />
                  </div>
                )}
                {this.props.showQuickNavigation && <QuickNavigation />}
              </div>
            </nav>
            <AccountDropdown />
          </div>
        </div>
      </div>
    );
  }
}

NavBar.defaultProps = {
  listItems: [],
  showQuickNavigation: false,
  showModernStackOnboardingRelaunch: false
};

NavBar.propTypes = {
  listItems: PropTypes.array.isRequired,
  showQuickNavigation: PropTypes.bool.isRequired,
  showModernStackOnboardingRelaunch: PropTypes.bool.isRequired
};
