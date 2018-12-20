import React from 'react';
import WithLink from 'components/shared/stack-onboarding/components/WithLink.es6';

import FullScreen from 'components/react/molecules/FullScreen.es6';
import Button from 'components/react/atoms/Button.es6';
import Skip from 'components/shared/stack-onboarding/components/Skip.es6';
import Icon from 'ui/Components/Icon.es6';

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

export default GetStarted;
