import React from 'react';
import {name as CreateModernOnboardingModule} from '../components/shared/auto_create_new_space/CreateModernOnboarding';
import {name as WithLinkModule} from '../components/shared/stack-onboarding/components/WithLink';

export const name = 'ms-relaunch';

angular.module('contentful')
  .factory(name, ['require', require => {
    const $rootScope = require('$rootScope');
    const spaceContext = require('spaceContext');
    const store = require('TheStore').getStore();
    const {getKey: getSpaceAutoCreatedKey} = require('components/shared/auto_create_new_space');
    const {getCurrentVariation} = require('utils/LaunchDarkly');
    const {
      MODERN_STACK_ONBOARDING_COMPLETE_EVENT,
      MODERN_STACK_ONBOARDING_FEATURE_FLAG,
      isDevOnboardingSpace,
      isOnboardingComplete,
      getUser
    } = require(CreateModernOnboardingModule);

    const WithLink = require(WithLinkModule);
    const Icon = require('ui/Components/Icon').default;

    class Relaunch extends React.Component {
      state = { flag: false }
      async componentDidMount () {
        const flag = await getCurrentVariation(MODERN_STACK_ONBOARDING_FEATURE_FLAG);

        // since this component is rendered when the onboarding begins, we need to ask it to update
        // once the onboarding is complete.
        // this component is rendered when the onboarding begins since it's jammed into the dom
        // by angular-ui-router in "views" for "/spaces" url. And throughout onboarding, this
        // componnet isn't ejected from the DOM hence it keeps the old state and hides itself
        // even after onboarding is complete. This fixes that by asking it to re-render once
        // onboarding is complete
        $rootScope.$on(MODERN_STACK_ONBOARDING_COMPLETE_EVENT, () => this.forceUpdate());

        this.setState({ flag });
      }
      render () {
        const spaceAutoCreationFailed = store.get(getSpaceAutoCreatedKey(getUser(), 'failure'));
        const currentSpace = spaceContext.space;
        const { flag } = this.state;

        const showRelaunch =
              flag && !spaceAutoCreationFailed && isDevOnboardingSpace(currentSpace) && isOnboardingComplete();

        if (showRelaunch) {
          return (
            <WithLink link='copy' trackingElementId='onboarding_relaunched'>
              {
                move => (
                  <div className='modern-stack-onboarding--relaunch-wrapper nav-bar__link' onClick={move}>
                    <Icon name='relaunch-onboarding' className='modern-stack-onboarding--relaunch-icon'/>
                    <span className='nav-bar__list-label'>Relaunch onboarding</span>
                  </div>
                )
              }
            </WithLink>
          );
        }
        return null;
      }
    }

    return Relaunch;
  }]);
