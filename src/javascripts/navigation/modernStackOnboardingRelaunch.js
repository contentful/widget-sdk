import React from 'react';
import WithLink from 'components/shared/stack-onboarding/components/WithLink';
import { cx, css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import { getBrowserStorage } from 'core/services/BrowserStorage';
import { getSpaceAutoCreatedKey } from 'components/shared/auto_create_new_space/getSpaceAutoCreatedKey';
import {
  MODERN_STACK_ONBOARDING_COMPLETE_EVENT,
  isDevOnboardingSpace,
  isOnboardingComplete,
  getUser,
} from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import Icon from 'ui/Components/Icon';
import { getModule } from 'core/NgRegistry';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

const store = getBrowserStorage();
const styles = {
  modernStackOnboardingRelaunchWrapper: css({
    display: 'flex',
    justifyContent: 'center',
    height: '100%',
    padding: '0 40px',
    color: tokens.colorWhite,
  }),
  navBarLink: css({
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    transition: 'color 0.1s ease-in-out',
    position: 'relative',
    cursor: 'pointer',
    '&:hover': css({
      backgroundColor: tokens.colorContrastDark,
    }),
    '&.is-active': css({
      backgroundColor: tokens.colorContrastMid,
    }),
  }),
  navBarListLabel: css({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
  }),
};

export default class Relaunch extends React.Component {
  static contextType = SpaceEnvContext;

  componentDidMount() {
    const $rootScope = getModule('$rootScope');

    // since this component is rendered when the onboarding begins, we need to ask it to update
    // once the onboarding is complete.
    // this component is rendered when the onboarding begins since it's jammed into the dom
    // by angular-ui-router in "views" for "/spaces" url. And throughout onboarding, this
    // componnet isn't ejected from the DOM hence it keeps the old state and hides itself
    // even after onboarding is complete. This fixes that by asking it to re-render once
    // onboarding is complete
    // TODO: move space id from the context to redux, as well as onboarding completion
    this.unsubscribeFromOnboarding = $rootScope.$on(MODERN_STACK_ONBOARDING_COMPLETE_EVENT, () =>
      this.forceUpdate()
    );
    this.unsubscribeFromSpaceContext = $rootScope.$on('spaceContextUpdated', () =>
      this.forceUpdate()
    );
  }
  componentWillUnmount() {
    this.unsubscribeFromOnboarding && this.unsubscribeFromOnboarding();
    this.unsubscribeFromSpaceContext && this.unsubscribeFromSpaceContext();
  }
  render() {
    const spaceAutoCreationFailed = store.get(getSpaceAutoCreatedKey(getUser(), 'failure'));
    const { currentSpaceName, currentSpaceId } = this.context;

    const showRelaunch =
      !spaceAutoCreationFailed &&
      isDevOnboardingSpace(currentSpaceName, currentSpaceId) &&
      isOnboardingComplete();

    if (showRelaunch) {
      return (
        <WithLink link="copy" trackingElementId="onboarding_relaunched">
          {(move) => (
            <div
              className={cx(styles.modernStackOnboardingRelaunchWrapper, styles.navBarLink)}
              onClick={move}
              data-test-id="modern-stack-onboarding-relaunch-wrapper">
              <Icon name="relaunch-onboarding" className="modern-stack-onboarding--relaunch-icon" />
              <span className={styles.navBarListLabel}>Relaunch onboarding</span>
            </div>
          )}
        </WithLink>
      );
    }
    return null;
  }
}
