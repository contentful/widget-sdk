import React from 'react';
import createReactClass from 'create-react-class';

import {name as FullScreenModule} from '../../../react/molecules/FullScreen';
import {name as SkipModule} from '../components/Skip';
import {name as NavigationModule} from '../components/Navigation';
import {name as DeploymentStrategiesModule} from '../deployment/DeploymentStrategies';
import {name as DeploymentFormModule} from '../deployment/DeploymentForm';
import {name as WithLinkModule} from '../components/WithLink';

export const name = 'deploy-screen-onboarding';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Skip = require(SkipModule);
  const Navigation = require(NavigationModule);
  const DeploymentStrategies = require(DeploymentStrategiesModule);
  const WithLink = require(WithLinkModule);
  const DeploymentForm = require(DeploymentFormModule);

  const DeployScreen = createReactClass({
    getInitialState () {
      return {
        provider: 'no_provider'
      };
    },
    selectProvider (provider) {
      this.setState({ provider });
    },
    renderHeader () {
      return (
        <React.Fragment>
          <h1 className={'modern-stack-onboarding--title'}>
            {'Deploy the '}
            <strong>
              {'Gatsby Starter for Contentful'}
            </strong>
            {' blog repository.'}
          </h1>
          <h3 className={'modern-stack-onboarding--subtitle'}>
            {'Select your preferred deployment service to see the CLI deploy commands.'}
          </h3>
          </React.Fragment>
      );
    },
    render () {
      const { provider } = this.state;
      return (
        <FullScreen close={<Skip link={'deploy'} />}>
          <Navigation active={3} />
          {this.renderHeader()}
          <div className={'modern-stack-onboarding--deploy-content'}>
            <DeploymentStrategies />
          </div>
          <WithLink trackingElementId={`deploy_screen_completed:${provider}`} link={'spaceHome'}>
            {move => <DeploymentForm onProviderChange={this.selectProvider} onComplete={move} />}
          </WithLink>
        </FullScreen>
      );
    }
  });

  return DeployScreen;
}]);
