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
import { NewOnboardingCTA } from 'features/onboarding';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { FLAGS, getVariation } from 'LaunchDarkly';

export const AdminSpaceHome = ({
  spaceName,
  spaceId,
  orgId,
  isSupportEnabled,
  hasTeamsEnabled,
  isTrialSpace,
  isEmptySpace,
}) => {
  const [isNewOnboardingEnabled, setIsNewOnboardingEnabled] = useState(false);
  const spaceContext = useSpaceEnvContext();

  useEffect(() => {
    (async function () {
      const newOnboardingEnabled = await getVariation(FLAGS.NEW_ONBOARDING_FLOW, {
        spaceId: spaceContext.currentSpaceId,
        organizationId: spaceContext.currentOrganizationId,
        environmentId: spaceContext.currentEnvironmentId,
      });

      setIsNewOnboardingEnabled(newOnboardingEnabled);
    })();
  }, [spaceContext]);

  return (
    <WidgetContainer testId="admin-space-home">
      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <Heading className={styles.header}>
            Welcome to your <span className={styles.demiBold}>{spaceName}</span> space
          </Heading>
          {!isTrialSpace && (
            <Subheading className={styles.description}>
              Use this space to create and publish content with others from your organization.
              <br />
              Explore ways to get started below.
            </Subheading>
          )}
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      {isNewOnboardingEnabled && isEmptySpace && (
        <WidgetContainer.Row>
          <NewOnboardingCTA spaceId={spaceId} />
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
          <AddCoworkerCTA orgId={orgId} spaceId={spaceId} hasTeamsEnabled={hasTeamsEnabled} />
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
};
