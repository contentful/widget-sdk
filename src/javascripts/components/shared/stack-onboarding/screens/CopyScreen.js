import React from 'react';
import createReactClass from 'create-react-class';

import {name as FullScreenModule} from '../../../react/molecules/FullScreen';
import {name as SkipModule} from '../components/Skip';
import {name as ButtonModule} from '../../../react/atoms/Button';
import {name as CodeModule} from '../../../react/atoms/Code';
import {name as NavigationModule} from '../components/Navigation';
import {name as WithLinkModule} from '../components/WithLink';
import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';
import {name as ScreenHeaderModule} from './Header';

export const name = 'copy-screen-component';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const $stateParams = require('$stateParams');
  const { getCredentials } = require(CreateModernOnboardingModule);

  const FullScreen = require(FullScreenModule);
  const Skip = require(SkipModule);
  const Button = require(ButtonModule);
  const Code = require(CodeModule);
  const Navigation = require(NavigationModule);
  const WithLink = require(WithLinkModule);
  const ScreenHeader = require(ScreenHeaderModule);

  const CopyScreen = createReactClass({
    getInitialState () {
      return {
        pending: true
      };
    },
    async componentDidMount () {
      const { managementToken, deliveryToken } = await getCredentials();

      this.setState({ managementToken, deliveryToken, pending: false });
    },
    renderCodeLine (code) {
      return (
        <div className={'modern-stack-onboarding--copyscreen-snippet'}>
          <Code
            lineNumbers={false}
            copy
            code={code}
            tooltipPosition={'right'}
          />
        </div>
      );
    },
    getSetupLine () {
      const { pending, managementToken, deliveryToken } = this.state;

      if (pending) {
        return 'Loading...';
      }

      const space = `--spaceId ${$stateParams.spaceId}`;
      const CDA = `--deliveryToken ${deliveryToken}`;
      const CMA = `--managementToken ${managementToken}`;

      return `npm run setup -- ${space} ${CDA} ${CMA}`;
    },
    renderGitSteps () {
      return (
        <React.Fragment>
          {this.renderCodeLine('git clone https://github.com/contentful/starter-gatsby-blog.git')}
          {this.renderCodeLine('cd starter-gatsby-blog')}
          {this.renderCodeLine('npm install')}
          {this.renderCodeLine(this.getSetupLine())}
        </React.Fragment>
      );
    },
    render () {
      const headerTitle = (
        <React.Fragment>
          Copy the&nbsp;
          <strong>
            Gatsby Starter for Contentful
          </strong>
          &nbsp;blog.
        </React.Fragment>
      );
      const headerSubtitle = <p>You’ll need a local copy of this repository to deploy in the next steps.</p>;

      return (
        <FullScreen close={<Skip link='copy' />}>
          <Navigation active={1} />
          <ScreenHeader title={headerTitle} subtitle={headerSubtitle} />
          <div className='modern-stack-onboarding--copyscreen-content'>
            <div className='modern-stack-onboarding--copyscreen-text'>
              Copy the following commands into your terminal:
            </div>
            {this.renderGitSteps()}
            <div className='modern-stack-onboarding--copyscreen-text'>
              See the blog in action:
            </div>
            {this.renderCodeLine('npm run dev')}
            <div className='modern-stack-onboarding--copyscreen-text'>
              View the blog in your browser, then come back to explore how it’s built.
            </div>
            <WithLink
              intercomKey='onboardingCopyCompleted'
              trackingElementId='copy_screen_completed'
              link='explore'
            >
              {move => (
                <Button
                  onClick={move}
                  className='modern-stack-onboarding--next-button modern-stack-onboarding--next-button__left'
                  data-test-id='onboarding-explore-cta'
                >
                  Explore the blog structure
                </Button>
              )}
            </WithLink>
          </div>
        </FullScreen>
      );
    }
  });

  return CopyScreen;
}]);
