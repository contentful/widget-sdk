import React, { useCallback } from 'react';

import Navigation from 'components/shared/stack-onboarding/components/Navigation';
import WithLink from 'components/shared/stack-onboarding/components/WithLink';
import ScreenHeader from 'components/shared/stack-onboarding/screens/Header';

import { getCredentials } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';

import FullScreen from 'components/shared/stack-onboarding/components/FullScreen';
import Skip from 'components/shared/stack-onboarding/components/Skip';
import Button from 'components/shared/stack-onboarding/components/Button';
import Code from 'components/shared/stack-onboarding/components/Code';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { useAsync } from 'core/hooks';

const CodeLine = ({ code }: { code: string }) => (
  <div className="modern-stack-onboarding--copyscreen-snippet">
    <Code lineNumbers={false} copy code={code} tooltipPosition="right" />
  </div>
);

const CopyScreen = () => {
  const { currentSpaceId } = useSpaceEnvContext();
  const { isLoading, data } = useAsync(
    useCallback(async () => {
      const { managementToken, deliveryToken } = await getCredentials();
      return {
        currentSpaceId,
        managementToken,
        deliveryToken,
      };
    }, [])
  );

  const { managementToken, deliveryToken } = data || {};
  const setupLine = isLoading
    ? 'Loading...'
    : `npm run setup -- --spaceId ${currentSpaceId} --deliveryToken ${deliveryToken} --managementToken ${managementToken}`;

  const headerTitle = (
    <>
      Copy the&nbsp;
      <strong>Gatsby Starter for Contentful</strong>
      &nbsp;blog.
    </>
  );

  const headerSubtitle = (
    <p>You’ll need a local copy of this repository to deploy in the next steps.</p>
  );

  return (
    <FullScreen close={<Skip link="copy" />}>
      <Navigation active={1} />
      <ScreenHeader title={headerTitle} subtitle={headerSubtitle} />
      <div className="modern-stack-onboarding--copyscreen-content">
        <div className="modern-stack-onboarding--copyscreen-text">
          Copy the following commands into your terminal:
        </div>
        <CodeLine code="git clone https://github.com/contentful/starter-gatsby-blog.git" />
        <CodeLine code="cd starter-gatsby-blog" />
        <CodeLine code="npm install" />
        <CodeLine code={setupLine} />
        <div className="modern-stack-onboarding--copyscreen-text">See the blog in action:</div>
        <CodeLine code="npm run dev" />
        <div className="modern-stack-onboarding--copyscreen-text">
          View the blog in your browser, then come back to explore how it’s built.
        </div>
        <WithLink
          intercomKey="onboardingCopyCompleted"
          trackingElementId="copy_screen_completed"
          link="explore">
          {(move) => (
            <Button
              onClick={move}
              className="modern-stack-onboarding--next-button modern-stack-onboarding--next-button__left"
              data-test-id="onboarding-explore-cta">
              Explore the blog structure
            </Button>
          )}
        </WithLink>
      </div>
    </FullScreen>
  );
};

export default CopyScreen;
