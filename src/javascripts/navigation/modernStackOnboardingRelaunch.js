import React from 'react';
import {name as CreateModernOnboardingModule} from '../components/shared/auto_create_new_space/CreateModernOnboarding';
import {name as WithLinkModule} from '../components/shared/stack-onboarding/components/WithLink';

export const name = 'ms-relaunch';

angular.module('contentful')
  .factory(name, ['require', require => {
    const spaceContext = require('spaceContext');
    const store = require('TheStore').getStore();
    const {getKey: getSpaceAutoCreatedKey} = require('components/shared/auto_create_new_space');
    const {getCurrentVariation} = require('utils/LaunchDarkly');
    const {
      MODERN_STACK_ONBOARDING_FEATURE_FLAG,
      isDevOnboardingSpace,
      isOnboardingComplete,
      getUser
    } = require(CreateModernOnboardingModule);

    const WithLink = require(WithLinkModule);
    const Icon = require('ui/Components/Icon').default;

    class Relaunch extends React.Component {
      constructor () {
        super();
        this.state = { flag: false };
      }
      async componentDidMount () {
        const flag = await getCurrentVariation(MODERN_STACK_ONBOARDING_FEATURE_FLAG);

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
