import React, { Component } from 'react';
import { cx, css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import enhanceWithClickOutside from 'react-click-outside';
import * as K from 'utils/kefir.es6';

import * as Analytics from 'analytics/Analytics.es6';
import * as Authentication from 'Authentication.es6';
import * as Intercom from 'services/intercom.es6';
import * as Config from 'Config.es6';
import * as TokenStore from 'services/TokenStore.es6';
import { getCurrentStateName, href } from 'states/Navigator.es6';

import {
  Icon,
  Dropdown,
  DropdownList,
  DropdownListItem,
  TabFocusTrap
} from '@contentful/forma-36-react-components';

const styles = {
  dropdown: css({
    height: '70px', // Height of navigation bar
    backgroundColor: tokens.colorContrastMid,
    boxShadow: 'inset 1px 0 2px 0 rgba(0,0,0,0.4), inset 2px 0 5px 0 rgba(0,0,0,0.35)',
    transition: `
      background-color ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault},
      box-shadow ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}
    `,

    '&:hover': {
      backgroundColor: tokens.colorContrastDark,
      boxShadow: 'inset 1px 0 2px 0 rgba(0,0,0,0.9), inset 2px 0 5px 0 rgba(0,0,0,0.75)'
    }
  }),

  dropdownActive: css({
    backgroundColor: tokens.colorContrastDark,
    boxShadow: 'inset 1px 0 2px 0 rgba(0,0,0,0.9), inset 2px 0 5px 0 rgba(0,0,0,0.75)'
  }),

  accountDropdownButton: css({
    height: '100%'
  }),

  focusTrap: css({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${tokens.spacingL}`
  }),

  imageWrapper: css({
    position: 'relative'
  }),

  avatar: css({
    display: 'block',
    height: '24px',
    width: '24px',
    borderRadius: '50%'
  }),

  dropdownIcon: css({
    marginLeft: tokens.spacingXs
  })
};

class AccountDropdown extends Component {
  constructor(props) {
    super(props);
    const currentUser = K.getValue(TokenStore.user$);

    this.state = {
      isOpen: false,
      currentUser: currentUser
    };
  }

  state = {
    isOpen: false,
    user: {}
  };

  handleToggle = () => {
    this.setState(prevState => {
      return {
        isOpen: !prevState.isOpen
      };
    });
  };

  handleClickOutside = () => {
    this.setState({
      isOpen: false
    });
  };

  handleLogout = () => {
    Analytics.track('global:logout_clicked');
    Analytics.disable();
    Authentication.logout();
  };

  handleLiveChat = () => {
    Analytics.track('element:click', {
      elementId: 'contact_sales_dropdown',
      groupId: 'contact_sales',
      fromState: getCurrentStateName()
    });
    Intercom.open();
  };

  render() {
    return (
      <Dropdown
        className={cx(styles.dropdown, this.state.isOpen && styles.dropdownActive)}
        isOpen={this.state.isOpen}
        role="menu"
        aria-label="Account Menu"
        testId="account-menu"
        toggleElement={
          // eslint-disable-next-line rulesdir/restrict-non-f36-components
          <button
            className={styles.accountDropdownButton}
            onClick={this.handleToggle}
            data-test-id="account-menu-trigger"
            data-ui-tour-step="account-menu-trigger">
            <TabFocusTrap className={styles.focusTrap}>
              <span className={styles.imageWrapper}>
                {!!this.state.currentUser && (
                  <img
                    className={styles.avatar}
                    src={this.state.currentUser.avatarUrl}
                    data-user-email={this.state.currentUser.email}
                    alt={`Avatar for user ${this.state.currentUser.firstName} ${this.state.currentUser.lastName}`}
                  />
                )}
              </span>

              <Icon className={styles.dropdownIcon} icon="ArrowDownTrimmed" color="white" />
            </TabFocusTrap>
          </button>
        }>
        <DropdownList border="bottom">
          <DropdownListItem
            testId="nav.account.userProfile"
            href={href({ path: ['account', 'profile', 'user'] })}>
            User Profile
          </DropdownListItem>
        </DropdownList>

        <DropdownList border="bottom">
          {Intercom.isEnabled && (
            <DropdownListItem testId="nav.account.intercom" onClick={this.handleLiveChat}>
              Talk to us
            </DropdownListItem>
          )}

          <DropdownListItem
            testId="nav.account.support"
            href={Config.supportUrl}
            target="_blank"
            rel="noopener noreferrer">
            Get support
          </DropdownListItem>
        </DropdownList>

        <DropdownList>
          <DropdownListItem testId="nav.account.logout" onClick={this.handleLogout}>
            Log out
          </DropdownListItem>
        </DropdownList>
      </Dropdown>
    );
  }
}

export default enhanceWithClickOutside(AccountDropdown);
