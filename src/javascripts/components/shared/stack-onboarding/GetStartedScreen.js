import React from 'react';
import createReactClass from 'create-react-class';
import {name as FullScreenModule} from './FullScreen';
import {name as ButtonModule} from './Button';
import {name as SkipModule} from './Skip';
import {name as WithLinkModule} from './WithLink';

const moduleName = 'get-started-component';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Button = require(ButtonModule);
  const Skip = require(SkipModule);
  const WithLink = require(WithLinkModule);

  const GetStarted = createReactClass({
    render () {
      return (
        <FullScreen close={<Skip link={'getStarted'} />}>
          <h1 className={'modern-stack-onboarding--title'}>
            {'Ready to deploy a website using the latest web techonologies?'}
          </h1>
          <h3 className={'modern-stack-onboarding--subtitle'}>
            {'You\'ll see how Contentful delivers content through APIs and integrates with a modern stack to build the fastest possible website.'}
          </h3>
          <WithLink link={'copy'}>
            {move => (
              <Button onClick={move} className={'modern-stack-onboarding--next-button'}>
                {'Get started'}
              </Button>
            )}
          </WithLink>
        </FullScreen>
      );
    }
  });

  return GetStarted;
}]);

export const name = moduleName;
