import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { styles } from './styles';
import { Heading, Subheading, Card } from '@contentful/forma-36-react-components';
import { AccordionComponent } from './components/AccordionComponent';
import { WidgetContainer } from './widgets/WidgetContainer';
import { ContactAnExpertCTA } from './components/ContactAnExpertCTA';
import { AddCoworkerCTA } from './components/AddCoworkerCTA';
import { GetSdkSection } from './components/GetSdkSection';
import { LearnAboutContentful } from './components/LearnAboutContentful';
import { ExampleProjectOverview } from './components/ExampleProjectOverview';
import { SpaceTrialWidget } from 'features/trials';
import { ComposeAndLaunchCTA } from './components/ComposeAndLaunchCTA';
import { ContentfulAppsCTA } from './components/ContentfulAppsCTA';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { DiscoverOnboardingCTA } from 'features/onboarding';

export const TEAAdminSpaceHome = ({
  spaceName,
  orgId,
  spaceId,
  cdaToken,
  cpaToken,
  isSupportEnabled,
  hasTeamsEnabled,
  isTrialSpace,
  inviteCardExperimentEnabled,
}) => {
  const [isRecoverableOnboardingEnabled, setIsRecoverableOnboardingEnabled] = useState(false);

  useEffect(() => {
    (async function () {
      const recoverableOnboardingEnabled = await getVariation(FLAGS.RECOVERABLE_ONBOARDING_FLOW, {
        spaceId: spaceId,
        organizationId: orgId,
      });

      const newOnboardingExperimentVariation = await getVariation(
        FLAGS.EXPERIMENT_ONBOARDING_MODAL,
        {
          spaceId: spaceId,
          organizationId: orgId,
        }
      );

      setIsRecoverableOnboardingEnabled(
        recoverableOnboardingEnabled && newOnboardingExperimentVariation
      );
    })();
  }, [spaceId, orgId]);

  return (
    <WidgetContainer>
      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <Heading className={styles.header}>
            Welcome to your <span className={styles.demiBold}>{spaceName}</span> space
          </Heading>
          {!isTrialSpace && (
            <Subheading className={styles.description}>
              Use this space to explore the sample content of an educational course catalog.
              <br />
              After viewing the existing content, try modifying an entry.
            </Subheading>
          )}
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      {isRecoverableOnboardingEnabled && (
        <WidgetContainer.Row>
          <DiscoverOnboardingCTA spaceId={spaceId} />
        </WidgetContainer.Row>
      )}

      <ComposeAndLaunchCTA />
      <ContentfulAppsCTA />

      <WidgetContainer.Row>
        <SpaceTrialWidget />
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <AccordionComponent
            drawersContent={[
              {
                headerText: <span className={styles.demiBold}>Play with our example project</span>,
                content: <ExampleProjectOverview cdaToken={cdaToken} cpaToken={cpaToken} />,
              },
            ]}
          />
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <AddCoworkerCTA
            spaceId={spaceId}
            orgId={orgId}
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
        <Card padding="large" className={styles.card}>
          <Subheading className={styles.subheading}>
            Learn what’s possible with Contentful
          </Subheading>
          <LearnAboutContentful />
        </Card>
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <GetSdkSection />
        </WidgetContainer.Col>
      </WidgetContainer.Row>
    </WidgetContainer>
  );
};
TEAAdminSpaceHome.propTypes = {
  spaceName: PropTypes.string.isRequired,
  orgId: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
  cdaToken: PropTypes.string.isRequired,
  cpaToken: PropTypes.string.isRequired,
  isSupportEnabled: PropTypes.bool.isRequired,
  hasTeamsEnabled: PropTypes.bool.isRequired,
  isTrialSpace: PropTypes.bool,
  inviteCardExperimentEnabled: PropTypes.bool,
};
