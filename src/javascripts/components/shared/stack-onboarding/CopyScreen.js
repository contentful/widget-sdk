import React from 'react';
import createReactClass from 'create-react-class';

import {name as FullScreenModule} from './FullScreen';
import {name as SkipModule} from './Skip';
import {name as ButtonModule} from './Button';
import {name as CodeModule} from './Code';
import {name as NavigationModule} from './Navigation';
import {name as WithLinkModule} from './WithLink';

const moduleName = 'copy-screen-component';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Skip = require(SkipModule);
  const Button = require(ButtonModule);
  const Code = require(CodeModule);
  const Navigation = require(NavigationModule);
  const WithLink = require(WithLinkModule);

  const CopyScreen = createReactClass({
    renderGitSteps () {
      const code = [
        'git clone https://github.com/contentful-userland/gatsby-contentful-starter.git',
        'cd gatsby-contentful-starter',
        'npm install',
        'npm run setup'
      ];
      return <Code language={'bash'} code={code} />;
    },
    renderToken ({ name, value }) {
      return (
        <div>
          <h4 className={'modern-stack-onboarding--copy-title'}>
            {name}
          </h4>
          <Code copy code={value} />
        </div>
      );
    },
    renderCredentials () {
      return (
        <React.Fragment>
          {this.renderToken({ name: 'Space ID', value: 'XXXXXXXXX' })}
          {this.renderToken({ name: 'Content Management API – access token', value: 'XXXXXXXXXXX' })}
          {this.renderToken({ name: 'Content Delivery API – access token', value: 'XXXXXXXXXX' })}
          {this.renderToken({ name: 'Content Preview API – access token', value: 'XXXXXXXXXXX' })}
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
              {`After running the code, you'll be asked to input a Space ID and access
                tokens that Contentful will use to create a space for the Contentful Intro Blog`}
            </div>
            {this.renderCredentials()}
            <div className={'modern-stack-onboarding--copyscreen-text'}>
              {`Once you've copied the repository and entered the access tokens, сontinue
                to see how this website is built.`}
            </div>
            <WithLink link={'explore'}>
              {move => (
                <Button onClick={move} className={'modern-stack-onboarding--next-button'}>
                  {'See how website is built'}
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

export const name = moduleName;
