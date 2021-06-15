import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import AccountDropdown from './AccountDropdown';
import { NavigationItem, NavigationItemType } from './NavigationItem';
import { NavigationDropdown } from './NavigationDropdown';
import { KnowledgeMenu } from './KnowledgeMenu/KnowledgeMenu';

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

const NavigationList = ({ items }: { items: NavigationItemType[] }) => {
  return (
    <ul className={styles.navBarList}>
      {items.map((item) => {
        if (item.render) {
          return item.render(item);
        } else if (item.children) {
          return <NavigationDropdown key={item.title} item={item} />;
        }
        return <NavigationItem key={item.title} item={item} />;
      })}
    </ul>
  );
};

export default class NavBar extends React.Component<{
  listItems: NavigationItemType[];
  children?: React.ReactNode;
}> {
  static defaultProps = {
    listItems: [],
  };

  render() {
    return (
      <div className="app-top-bar__child app-top-bar__child-wide" data-test-id="navbar-top">
        <div className="app-top-bar__inner-wrapper">
          <div className="app-top-bar__child app-top-bar__main-nav">
            <nav className={styles.navBar} aria-label="Main Navigation">
              <NavigationList items={this.props.listItems} />
              <div className={styles.navBarEnd}>
                {this.props.children}
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
