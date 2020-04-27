/* eslint-disable rulesdir/restrict-non-f36-components */

import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import AccountDropdown from './AccountDropdown';
import { QuickNavigation } from 'features/quick-navigation';
import OnboardingRelaunch from 'navigation/modernStackOnboardingRelaunch';
import NavigationItem from './NavigationItem';
import NavigationDropdown from './NavigationDropdown';
import KnowledgeMenu from './KnowledgeMenu/KnowledgeMenu';

const styles = {
  navBar: css({
    height: '100%',
    width: '100%',
    userSelect: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    paddingRight: tokens.spacingM,
  }),
  navBarList: css({
    display: 'flex',
  }),
  navBarEnd: css({
    display: 'flex',
  }),
};

class NavigationList extends React.Component {
  render() {
    return (
      <ul className={styles.navBarList}>
        {this.props.items.map((item) => {
          if (item.render) {
            return item.render(item);
          } else if (item.children) {
            return <NavigationDropdown key={item.title} item={item} />;
          }
          return <NavigationItem key={item.title} item={item} />;
        })}
      </ul>
    );
  }
}

NavigationList.propTypes = {
  items: PropTypes.array.isRequired,
};

export default class NavBar extends React.Component {
  render() {
    return (
      <div className="app-top-bar__child app-top-bar__child-wide">
        <div className="app-top-bar__inner-wrapper">
          <div className="app-top-bar__child app-top-bar__main-nav">
            <nav className={styles.navBar}>
              <NavigationList items={this.props.listItems} />
              <div className={styles.navBarEnd}>
                {this.props.showModernStackOnboardingRelaunch && (
                  <div className="app-top-bar__child">
                    <OnboardingRelaunch />
                  </div>
                )}
                {this.props.showQuickNavigation && <QuickNavigation />}
                <KnowledgeMenu />
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
  showModernStackOnboardingRelaunch: false,
};

NavBar.propTypes = {
  listItems: PropTypes.array.isRequired,
  showQuickNavigation: PropTypes.bool.isRequired,
  showModernStackOnboardingRelaunch: PropTypes.bool.isRequired,
};
