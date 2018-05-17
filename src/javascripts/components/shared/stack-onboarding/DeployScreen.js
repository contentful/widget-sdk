import React from 'react';
import createReactClass from 'create-react-class';

import {name as FullScreenModule} from './FullScreen';
import {name as SkipModule} from './Skip';
import {name as NavigationModule} from './Navigation';
import {name as DeploymentStrategiesModule} from './DeploymentStrategies';
import {name as DeploymentFormModule} from './DeploymentForm';
import {name as WithLinkModule} from './WithLink';

const moduleName = 'deploy-screen-onboarding';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Skip = require(SkipModule);
  const Navigation = require(NavigationModule);
  const DeploymentStrategies = require(DeploymentStrategiesModule);
  const WithLink = require(WithLinkModule);
  const DeploymentForm = require(DeploymentFormModule);

  const DeployScreen = createReactClass({
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
      return (
        <FullScreen close={<Skip link={'deploy'} />}>
          <Navigation active={3} />
          {this.renderHeader()}
          <div className={'modern-stack-onboarding--deploy-content'}>
            <DeploymentStrategies />
          </div>
          <WithLink link={'spaceHome'}>
            {move => <DeploymentForm onComplete={move} />}
          </WithLink>
        </FullScreen>
      );
    }
  });

  return DeployScreen;
}]);

export const name = moduleName;
