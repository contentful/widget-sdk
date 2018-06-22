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
    render () {
      const headerTitle = (
        <React.Fragment>
          Deploy the&nbsp;
          <strong>
            Gatsby Starter for Contentful
          </strong>
          &nbsp;blog.
        </React.Fragment>
      );
      const headerSubtitle = (
        <p>
          Select your preferred hosting service to see the CLI deploy commands.<br />
          We selected two hosting service options as an example to get you started.
        </p>
      );

      return (
        <FullScreen close={<Skip link='deploy' />}>
          <Navigation active={3} />
          <ScreenHeader title={headerTitle} subtitle={headerSubtitle} />
          <div className='modern-stack-onboarding--deploy-content'>
            <DeploymentStrategies />
          </div>
          <WithLink link='spaceHome'>
            {move => <DeploymentForm onComplete={(event, provider) => move(event, `deploy_screen_completed:${provider}`)} />}
          </WithLink>
        </FullScreen>
      );
    }
  });

  return DeployScreen;
}]);
