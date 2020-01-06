import React from 'react';
import WithLink from 'components/shared/stack-onboarding/components/WithLink';

import { getStore } from 'browserStorage';
import { getSpaceAutoCreatedKey } from 'components/shared/auto_create_new_space/getSpaceAutoCreatedKey';
import { getCurrentVariation } from 'utils/LaunchDarkly';
import {
  MODERN_STACK_ONBOARDING_COMPLETE_EVENT,
  MODERN_STACK_ONBOARDING_FEATURE_FLAG,
  isDevOnboardingSpace,
  isOnboardingComplete,
  getUser
} from 'components/shared/auto_create_new_space/CreateModernOnboarding';
import Icon from 'ui/Components/Icon';
import { getModule } from 'NgRegistry';

const store = getStore();

export default class Relaunch extends React.Component {
  state = { flag: false };
  async componentDidMount() {
    const $rootScope = getModule('$rootScope');

    const flag = await getCurrentVariation(MODERN_STACK_ONBOARDING_FEATURE_FLAG);

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

    this.setState({ flag });
  }
  componentWillUnmount() {
    this.unsubscribeFromOnboarding && this.unsubscribeFromOnboarding();
    this.unsubscribeFromSpaceContext && this.unsubscribeFromSpaceContext();
  }
  render() {
    const spaceContext = getModule('spaceContext');
    const spaceAutoCreationFailed = store.get(getSpaceAutoCreatedKey(getUser(), 'failure'));
    const currentSpace = spaceContext.space;
    const { flag } = this.state;

    const showRelaunch =
      flag &&
      !spaceAutoCreationFailed &&
      isDevOnboardingSpace(currentSpace) &&
      isOnboardingComplete();

    if (showRelaunch) {
      return (
        <WithLink link="copy" trackingElementId="onboarding_relaunched">
          {move => (
            <div className="modern-stack-onboarding--relaunch-wrapper nav-bar__link" onClick={move}>
              <Icon name="relaunch-onboarding" className="modern-stack-onboarding--relaunch-icon" />
              <span className="nav-bar__list-label">Relaunch onboarding</span>
            </div>
          )}
        </WithLink>
      );
    }
    return null;
  }
}