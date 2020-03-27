import React, { Component } from 'react';
import { cx, css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import * as Analytics from 'analytics/Analytics';
import * as Authentication from 'Authentication';
import * as Intercom from 'services/intercom';
import * as Config from 'Config';
import { getUser } from 'services/TokenStore';
import { getCurrentStateName } from 'states/Navigator';
import { getOpenAssignedTasksAndEntries } from 'app/TasksPage/helpers';
import { getCurrentSpaceFeature } from 'data/CMA/ProductCatalog';
import * as FeatureFlagKey from 'featureFlags';
import { getModule } from 'NgRegistry';
import StateLink from 'app/common/StateLink';

import {
  Icon,
  Dropdown,
  DropdownList,
  DropdownListItem,
  TabFocusTrap,
} from '@contentful/forma-36-react-components';

const styles = {
  dropdown: css({
    height: '100%',
    backgroundColor: tokens.colorContrastMid,
    boxShadow: 'inset 1px 0 2px 0 rgba(0,0,0,0.4), inset 2px 0 5px 0 rgba(0,0,0,0.35)',
    transition: `
      background-color ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault},
      background-color ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}
    `,
    '&:hover': {
      backgroundColor: tokens.colorContrastDark,
      boxShadow: 'inset 1px 0 2px 0 rgba(0,0,0,0.9), inset 2px 0 5px 0 rgba(0,0,0,0.75)',
    },
  }),
  dropdownActive: css({
    backgroundColor: tokens.colorContrastDark,
    boxShadow: 'inset 1px 0 2px 0 rgba(0,0,0,0.9), inset 2px 0 5px 0 rgba(0,0,0,0.75)',
  }),
  dropdownList: css({
    minWidth: '150px',
  }),
  accountDropdownButton: css({
    height: '100%',
  }),
  focusTrap: css({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${tokens.spacingM}`,
  }),
  imageWrapper: css({
    position: 'relative',
  }),
  avatar: css({
    display: 'block',
    height: '24px',
    width: '24px',
    borderRadius: '50%',
  }),
  dropdownIcon: css({
    marginLeft: tokens.spacingXs,
  }),
  notificationIcon: css({
    position: 'absolute',
    top: '20px',
    right: '26px',
    height: '12px',
    width: '12px',
    borderRadius: '50%',
    backgroundColor: tokens.colorWarning,
    border: `2px solid ${tokens.colorContrastMid}`,
  }),
  pendingTasksItem: css({
    display: 'inline-flex',
  }),
  pendingTaskCount: css({
    marginLeft: tokens.spacing2Xs,
    borderRadius: '50%',
    background: tokens.colorWarning,
    width: '1rem',
    height: '1rem',
    display: 'inline-flex',
    alignContent: 'center',
    justifyContent: 'center',
    color: '#fff',
    lineHeight: '1rem',
    alignSelf: 'center',
    fontSize: '0.6rem',
  }),
};

const getPendingTasksCount = (tasks, entries) => {
  // eslint-disable-next-line no-undef
  const seenEntries = new Map();
  let taskCount = 0;
  for (const task of tasks) {
    const entryId = task.sys.parentEntity.sys.id;
    if (seenEntries.has(entryId)) {
      if (seenEntries.get(entryId)) {
        taskCount++;
      }
      continue;
    }
    const isEntryAccessible = !!entries.find((e) => e.sys.id === entryId);
    seenEntries.set(entryId, isEntryAccessible);
    if (isEntryAccessible) {
      taskCount++;
    }
  }
  return taskCount;
};

const canDisplayTasksDashboard = async (spaceContext) =>
  spaceContext.space ? getCurrentSpaceFeature(FeatureFlagKey.CONTENT_WORKFLOW_TASKS, false) : false;

// we need to pass this utm parameters in the url
// to make sure that analytics know that the traffic in those pages are coming from the user_interface
const utmParams = '?utm_source=webapp&utm_medium=profile-menu&utm_campaign=in-app-help';

export default class AccountDropdown extends Component {
  state = {
    isOpen: false,
    currentUser: {},
    pendingTasksCount: 0,
    shouldShowPendingTasks: false,
  };

  componentDidMount = async () => {
    const spaceContext = getModule('spaceContext');
    const shouldShowPendingTasksPromise = canDisplayTasksDashboard(spaceContext);

    const currentUser = await getUser();
    this.setState({
      currentUser,
    });

    const shouldShowPendingTasks = await shouldShowPendingTasksPromise;

    if (currentUser && shouldShowPendingTasks) {
      const [tasks, entries] = await getOpenAssignedTasksAndEntries(
        spaceContext.space.getId(),
        spaceContext.getEnvironmentId(),
        currentUser.sys.id
      );
      const pendingTasksCount = getPendingTasksCount(tasks, entries);
      Analytics.track('account_dropdown:pending_tasks_fetched', {
        numPendingTasks: tasks.length,
        numVisiblePendingTasks: pendingTasksCount,
        hasInaccessibleTasks: tasks.length > pendingTasksCount,
      });
      this.setState({ pendingTasksCount, shouldShowPendingTasks: true });
    }
  };

  handleToggle = () => {
    this.setState((prevState) => ({ isOpen: !prevState.isOpen }));
  };

  handleLogout = () => {
    Analytics.track('global:logout_clicked');
    Analytics.disable();
    Authentication.logout();
    this.handleDropdownListItemClick();
  };

  handleLiveChat = () => {
    Analytics.track('element:click', {
      elementId: 'contact_sales_dropdown',
      groupId: 'contact_sales',
      fromState: getCurrentStateName(),
    });
    Intercom.open();
    this.handleDropdownListItemClick();
  };

  handleDropdownListItemClick = () => {
    this.setState({ isOpen: false });
  };

  render() {
    if (Object.keys(this.state.currentUser).length === 0) {
      return null;
    }

    return (
      <Dropdown
        className={cx(styles.dropdown, this.state.isOpen && styles.dropdownActive)}
        isOpen={this.state.isOpen}
        onClose={this.handleToggle}
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
                <img
                  className={styles.avatar}
                  src={this.state.currentUser.avatarUrl}
                  data-user-email={this.state.currentUser.email}
                  alt={`Avatar for user ${this.state.currentUser.firstName} ${this.state.currentUser.lastName}`}
                />
              </span>
              {this.state.pendingTasksCount > 0 && <span className={styles.notificationIcon} />}
              <Icon className={styles.dropdownIcon} icon="ArrowDownTrimmed" color="white" />
            </TabFocusTrap>
          </button>
        }>
        <DropdownList border="bottom" className={styles.dropdownList}>
          <StateLink path="account.profile.user">
            {({ getHref, onClick }) => (
              <DropdownListItem
                testId="nav.account.userProfile"
                onClick={(e) => {
                  onClick(e);
                  this.handleDropdownListItemClick();
                }}
                href={getHref()}>
                Account settings
              </DropdownListItem>
            )}
          </StateLink>
          {this.state.shouldShowPendingTasks && (
            <StateLink path="spaces.detail.tasks.list">
              {({ getHref, onClick }) => (
                <DropdownListItem
                  testId="nav.account.pendingTasks"
                  onClick={(e) => {
                    onClick(e);
                    this.handleDropdownListItemClick();
                  }}
                  href={getHref()}>
                  <span className={styles.pendingTasksItem}>
                    {`Pending tasks (${this.state.pendingTasksCount})`}
                  </span>
                </DropdownListItem>
              )}
            </StateLink>
          )}
        </DropdownList>

        <DropdownList border="bottom">
          <DropdownListItem
            testId="nav.account.help"
            href={`${Config.helpCenterUrl}${utmParams}`}
            target="_blank"
            onClick={this.handleDropdownListItemClick}>
            Help center
          </DropdownListItem>

          <DropdownListItem
            testId="nav.account.docs"
            href={`${Config.developerDocsUrl}/${utmParams}`}
            target="_blank"
            onClick={this.handleDropdownListItemClick}>
            Developer docs
          </DropdownListItem>

          {Intercom.isEnabled && (
            <DropdownListItem testId="nav.account.intercom" onClick={this.handleLiveChat}>
              Talk to us
            </DropdownListItem>
          )}

          <DropdownListItem
            testId="nav.account.support"
            href={Config.supportUrl}
            target="_blank"
            onClick={this.handleDropdownListItemClick}
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
