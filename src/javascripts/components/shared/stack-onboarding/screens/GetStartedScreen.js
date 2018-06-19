import React from 'react';
import {name as FullScreenModule} from '../../../react/molecules/FullScreen';
import {name as ButtonModule} from '../../../react/atoms/Button';
import {name as SkipModule} from '../components/Skip';
import {name as WithLinkModule} from '../components/WithLink';

export const name = 'get-started-component';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Button = require(ButtonModule);
  const Skip = require(SkipModule);
  const WithLink = require(WithLinkModule);

  const GetStarted = () => {
    return (
      <FullScreen close={<Skip link='getStarted' />}>
        <h1 className='modern-stack-onboarding--title'>
          Contentful works with the latest web technologies.
        </h1>
        <h3 className='modern-stack-onboarding--subtitle'>
          We selected a static site stack as an example to get you started.
        </h3>
        <WithLink trackingElementId='get_started_screen_completed' link='copy'>
          {move => (
            <Button onClick={move} className='modern-stack-onboarding--next-button'>
              Get started
            </Button>
          )}
        </WithLink>
      </FullScreen>
    );
  };

  return GetStarted;
}]);
