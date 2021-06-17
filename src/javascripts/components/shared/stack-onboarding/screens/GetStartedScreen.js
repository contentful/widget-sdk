import React, { useCallback } from 'react';
import WithLink from 'components/shared/stack-onboarding/components/WithLink';
import FullScreen from 'components/shared/stack-onboarding/components/FullScreen';
import Button from 'components/shared/stack-onboarding/components/Button';
import Skip from 'components/shared/stack-onboarding/components/Skip';
import Icon from 'ui/Components/Icon';
import { useAsync } from 'core/hooks';
import { getVariation, FLAGS } from 'core/feature-flags';
import { track } from 'analytics/Analytics';
import { Flex, ModalLauncher } from '@contentful/forma-36-react-components';
import { unmarkSpace } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import {
  handleReplaceSpace,
  handleGetStarted,
  FlexibleOnboardingDialog,
  hasSeenExploreOnboarding,
} from 'features/onboarding';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { router } from 'core/react-routing';

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
  'brunch',
];

const styles = {
  backButton: css({
    marginRight: tokens.spacingL,
  }),
};

const GetStarted = () => {
  const spaceContext = useSpaceEnvContext();

  const { data } = useAsync(
    useCallback(async () => {
      const newOnboardingEnabled = await getVariation(FLAGS.NEW_ONBOARDING_FLOW, {
        spaceId: spaceContext.currentSpaceId,
        organizationId: spaceContext.currentOrganizationId,
        environmentId: spaceContext.currentEnvironmentId,
      });

      const recoverableOnboardingEnabled = await getVariation(FLAGS.RECOVERABLE_ONBOARDING_FLOW, {
        spaceId: spaceContext.currentSpaceId,
        organizationId: spaceContext.currentOrganizationId,
        environmentId: spaceContext.currentEnvironmentId,
      });

      const newOnboardingExperimentVariation = await getVariation(
        FLAGS.EXPERIMENT_ONBOARDING_MODAL,
        {
          spaceId: spaceContext.currentSpaceId,
          organizationId: spaceContext.currentOrganizationId,
          environmentId: spaceContext.currentEnvironmentId,
        }
      );
      const hasSeenOnboarding = await hasSeenExploreOnboarding();
      return {
        recoverableOnboardingEnabled:
          recoverableOnboardingEnabled && newOnboardingExperimentVariation && hasSeenOnboarding,
        showFlexibleOnboarding: newOnboardingEnabled && newOnboardingExperimentVariation,
      };
    }, [spaceContext])
  );

  const logos = (
    <div className={'modern-stack-onboarding--logogrid-grid'}>
      {icons.map((icon) => (
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
        <Flex justifyContent="center">
          {data?.showFlexibleOnboarding === true && (
            <Button
              buttonType="muted"
              className={styles.backButton}
              onClick={() => {
                track('onboarding_gatsby_blog:back');
                unmarkSpace();
                router.navigate({ path: 'spaces.detail.home' });
                ModalLauncher.open(({ isShown, onClose }) => {
                  return (
                    <FlexibleOnboardingDialog
                      isShown={isShown}
                      onClose={onClose}
                      spaceId={spaceContext.currentSpaceId}
                      replaceSpace={data.recoverableOnboardingEnabled}
                    />
                  );
                });
              }}
              testId="back-btn">
              Back
            </Button>
          )}
          <WithLink
            intercomKey="onboardingStackOverviewCompleted"
            trackingElementId="get_started_screen_completed"
            link="copy">
            {(move) => (
              <Button
                onClick={() => {
                  if (data.recoverableOnboardingEnabled) {
                    handleReplaceSpace(spaceContext.currentSpaceId);
                  } else {
                    if (data.showFlexibleOnboarding) {
                      handleGetStarted(spaceContext.currentSpaceId);
                    }
                    move();
                  }
                }}
                data-test-id="onboarding-get-started-cta">
                Get started
              </Button>
            )}
          </WithLink>
        </Flex>
      </div>
    </FullScreen>
  );
};

export default GetStarted;
