import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { styles } from './styles';
import { Heading, Subheading, Card } from '@contentful/forma-36-react-components';
import { WidgetContainer } from './widgets/WidgetContainer';
import { GetSdkSection } from './components/GetSdkSection';
import { UpgradePricing } from './UpgradePricing';
import { LearnAboutContentful } from './components/LearnAboutContentful';
import { ContactAnExpertCTA } from './components/ContactAnExpertCTA';
import { AppsCTA } from './components/AppsCTA';
import { AddCoworkerCTA } from './components/AddCoworkerCTA';
import { SpaceTrialWidget } from 'features/trials';
import { ComposeAndLaunchCTA } from './components/ComposeAndLaunchCTA';
import { ContentfulAppsCTA } from './components/ContentfulAppsCTA';
import {
  NewOnboardingCTA,
  DiscoverOnboardingCTA,
  hasSeenExploreOnboarding,
} from 'features/onboarding';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { tracking } from 'analytics/Analytics';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getOrganization } from 'services/TokenStore';

export const AdminSpaceHome = ({
  spaceName,
  spaceId,
  orgId,
  isSupportEnabled,
  hasTeamsEnabled,
  isTrialSpace,
  isEmptySpace,
  inviteCardExperimentEnabled,
}) => {
  const [isNewOnboardingEnabled, setIsNewOnboardingEnabled] = useState(false);
  const [isRecoverableOnboardingEnabled, setIsRecoverableOnboardingEnabled] = useState(false);
  const spaceContext = useSpaceEnvContext();

  useEffect(() => {
    (async function () {
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

      if (newOnboardingExperimentVariation !== null) {
        tracking.experimentStart({
          experiment_id: FLAGS.EXPERIMENT_ONBOARDING_MODAL,
          experiment_variation: newOnboardingExperimentVariation
            ? 'flexible-onboarding'
            : 'control',
        });
      }
      const organization = await getOrganization(orgId);
      const hasSeenOnboarding = await hasSeenExploreOnboarding();

      setIsNewOnboardingEnabled(
        newOnboardingEnabled && newOnboardingExperimentVariation && !hasSeenOnboarding
      );
      setIsRecoverableOnboardingEnabled(
        recoverableOnboardingEnabled &&
          newOnboardingExperimentVariation &&
          isOwnerOrAdmin(organization) &&
          hasSeenOnboarding
      );
    })();
  }, [spaceContext, orgId]);

  return (
    <WidgetContainer testId="admin-space-home">
      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <Heading className={styles.header}>
            Welcome to your <span className={styles.demiBold}>{spaceName}</span> space
          </Heading>
          {!isTrialSpace && (
            <>
              {(isNewOnboardingEnabled || isRecoverableOnboardingEnabled) && (
                <>
                  {isEmptySpace ? (
                    <Subheading className={styles.description}>
                      Use this blank space to build it your way from scratch.
                    </Subheading>
                  ) : (
                    <Subheading className={styles.description}>
                      Use this pre-built space to place your content.
                    </Subheading>
                  )}
                </>
              )}
              {!isNewOnboardingEnabled && !isRecoverableOnboardingEnabled && (
                <Subheading className={styles.description}>
                  Use this space to create and publish content with others from your organization.
                  <br />
                  Explore ways to get started below.
                </Subheading>
              )}
            </>
          )}
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      {isNewOnboardingEnabled && isEmptySpace && (
        <WidgetContainer.Row>
          <NewOnboardingCTA spaceId={spaceId} />
        </WidgetContainer.Row>
      )}

      {isRecoverableOnboardingEnabled && (
        <WidgetContainer.Row>
          <DiscoverOnboardingCTA spaceId={spaceId} />
        </WidgetContainer.Row>
      )}

      <WidgetContainer.Row>
        <UpgradePricing />
      </WidgetContainer.Row>

      <ContentfulAppsCTA />
      <ComposeAndLaunchCTA />

      <WidgetContainer.Row>
        <SpaceTrialWidget />
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <Card padding="large" className={styles.card}>
          <Subheading className={styles.subheading}>
            Learn what’s possible with Contentful
          </Subheading>
          <LearnAboutContentful />
        </Card>
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <AddCoworkerCTA
            orgId={orgId}
            spaceId={spaceId}
            hasTeamsEnabled={hasTeamsEnabled}
            inviteCardExperimentEnabled={inviteCardExperimentEnabled}
          />
        </WidgetContainer.Col>
        {isSupportEnabled && (
          <WidgetContainer.Col>
            <ContactAnExpertCTA />
          </WidgetContainer.Col>
        )}
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <GetSdkSection />
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <AppsCTA />
        </WidgetContainer.Col>
      </WidgetContainer.Row>
    </WidgetContainer>
  );
};

AdminSpaceHome.propTypes = {
  spaceName: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
  orgId: PropTypes.string.isRequired,
  isSupportEnabled: PropTypes.bool.isRequired,
  hasTeamsEnabled: PropTypes.bool.isRequired,
  isTrialSpace: PropTypes.bool,
  isEmptySpace: PropTypes.bool,
  inviteCardExperimentEnabled: PropTypes.bool,
};
