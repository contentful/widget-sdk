import React from 'react';
import { name as FullScreenModule } from '../../../react/molecules/FullScreen';
import { name as ButtonModule } from '../../../react/atoms/Button';
import { name as SkipModule } from '../components/Skip';
import { name as WithLinkModule } from '../components/WithLink';

export const name = 'get-started-component';

angular.module('contentful').factory(name, [
  'require',
  function(require) {
    const FullScreen = require(FullScreenModule);
    const Button = require(ButtonModule);
    const Skip = require(SkipModule);
    const WithLink = require(WithLinkModule);
    const Icon = require('ui/Components/Icon').default;

    const icons = [
      'aws',
      'dotnet',
      'javascript',
      'metalsmith',
      'python',
      'ruby',
      'swift',
      'php',
      'android',
      'jekyll',
      'gitbook',
      'brunch'
    ];

    const GetStarted = () => {
      const logos = (
        <div className={'modern-stack-onboarding--logogrid-grid'}>
          {icons.map(icon => (
            <div key={icon} className={`modern-stack-onboarding--logogrid-elem__${icon}`}>
              <Icon name={icon} />
            </div>
          ))}
        </div>
      );
      return (
        <FullScreen close={<Skip link="getStarted" />}>
          <h1 className="modern-stack-onboarding--title">
            Contentful works with the latest web technologies.
          </h1>
          <h3 className="modern-stack-onboarding--subtitle">
            We selected a static site stack as an example to get you started.
          </h3>
          <div className={'modern-stack-onboarding--logogrid-wrapper'}>
            {logos}
            <Icon className={'modern-stack-onboarding--logogrid-image'} name={'stack-overview'} />
            <WithLink
              intercomKey="onboardingStackOverviewCompleted"
              trackingElementId="get_started_screen_completed"
              link="copy">
              {move => (
                <Button
                  onClick={move}
                  className="modern-stack-onboarding--next-button"
                  data-test-id="onboarding-get-started-cta">
                  Get started
                </Button>
              )}
            </WithLink>
          </div>
        </FullScreen>
      );
    };

    return GetStarted;
  }
]);
