import React from 'react';
import createReactClass from 'create-react-class';

import {name as FullScreenModule} from '../../../react/molecules/FullScreen';
import {name as SkipModule} from '../components/Skip';
import {name as NavigationModule} from '../components/Navigation';
import {name as DeploymentStrategiesModule} from '../deployment/DeploymentStrategies';
import {name as DeploymentFormModule} from '../deployment/DeploymentForm';
import {name as WithLinkModule} from '../components/WithLink';
import {name as ScreenHeaderModule} from './Header';

export const name = 'deploy-screen-onboarding';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Skip = require(SkipModule);
  const Navigation = require(NavigationModule);
  const DeploymentStrategies = require(DeploymentStrategiesModule);
  const WithLink = require(WithLinkModule);
  const DeploymentForm = require(DeploymentFormModule);
  const ScreenHeader = require(ScreenHeaderModule);

  const DeployScreen = createReactClass({
    getInitialState () {
      return {
        provider: 'no_provider'
      };
    },
    selectProvider (provider) {
      this.setState({ provider });
    },
    render () {
      const { provider } = this.state;
      const headerTitle = (
        <React.Fragment>
          Deploy the&nbsp;
          <strong>
            Gatsby Starter for Contentful
          </strong>
          &nbsp;blog
        </React.Fragment>
      );
      const headerSubtitle = (
        <React.Fragment>
          <p>Select your preferred hosting service to see the CLI deploy commands.</p>
          <p>We’ve selected two hosting service options as an example to get you started.</p>
        </React.Fragment>
      );

      return (
        <FullScreen close={<Skip link='deploy' />}>
          <Navigation active={3} />
          <ScreenHeader title={headerTitle} subtitle={headerSubtitle} />
          <div className='modern-stack-onboarding--deploy-content'>
            <DeploymentStrategies />
          </div>
          <WithLink trackingElementId={`deploy_screen_completed:${provider}`} link='spaceHome'>
            {move => <DeploymentForm onProviderChange={this.selectProvider} onComplete={move} />}
          </WithLink>
        </FullScreen>
      );
    }
  });

  return DeployScreen;
}]);
