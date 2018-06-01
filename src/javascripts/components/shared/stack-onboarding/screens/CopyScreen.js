import React from 'react';
import createReactClass from 'create-react-class';

import {name as FullScreenModule} from '../../../react/molecules/FullScreen';
import {name as SkipModule} from '../components/Skip';
import {name as ButtonModule} from '../../../react/atoms/Button';
import {name as CodeModule} from '../../../react/atoms/Code';
import {name as NavigationModule} from '../components/Navigation';
import {name as WithLinkModule} from '../components/WithLink';
import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'copy-screen-component';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Skip = require(SkipModule);
  const Button = require(ButtonModule);
  const Code = require(CodeModule);
  const Navigation = require(NavigationModule);
  const WithLink = require(WithLinkModule);
  const $stateParams = require('$stateParams');
  const { getCredentials } = require(CreateModernOnboardingModule);

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
      return <Code lineNumbers={false} copy code={code} />;
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
          {this.renderCodeLine('git clone https://github.com/contentful-userland/gatsby-contentful-starter.git')}
          {this.renderCodeLine('cd gatsby-contentful-starter')}
          {this.renderCodeLine('npm install')}
          {this.renderCodeLine(this.getSetupLine())}
        </React.Fragment>
      );
    },
    renderHeader () {
      return (
        <React.Fragment>
          <h1 className={'modern-stack-onboarding--title'}>
            {'Copy the '}
            <strong>
              {'Gatsby Starter for Contentful'}
            </strong>
            {' blog repository.'}
          </h1>
          <h3 className={'modern-stack-onboarding--subtitle'}>
            {'You\'ll need a localcopy of this repository to deploy in the next steps.'}
          </h3>
          <div className={'modern-stack-onboarding--line'} />
        </React.Fragment>
      );
    },
    render () {
      return (
        <FullScreen close={<Skip link={'copy'} />}>
          <Navigation active={1} />
          {this.renderHeader()}
          <div className={'modern-stack-onboarding--copyscreen-content'}>
            <div className={'modern-stack-onboarding--copyscreen-text'}>
              {'Copy the following commands into your terminal'}
            </div>
            {this.renderGitSteps()}
            <div className={'modern-stack-onboarding--copyscreen-text'}>
              {'See the website in action on a localhost.'}
            </div>
            {this.renderCodeLine('npm run dev')}
            <div className={'modern-stack-onboarding--copyscreen-text'}>
              {'View the website in your browser, then explore how it’s built.'}
            </div>
            <WithLink trackingElementId={'copy_screen_completed'} link={'explore'}>
              {move => (
                <Button onClick={move} className={'modern-stack-onboarding--next-button modern-stack-onboarding--next-button__left'}>
                  {'Explore how the website is built'}
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
