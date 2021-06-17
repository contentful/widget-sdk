import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { styles } from './styles';
import { Heading, Subheading, Card } from '@contentful/forma-36-react-components';
import { WidgetContainer } from './widgets/WidgetContainer';
import { ContactAnExpertCTA } from './components/ContactAnExpertCTA';
import { AddCoworkerCTA } from './components/AddCoworkerCTA';
import { GetSdkSection } from './components/GetSdkSection';
import { LearnAboutContentful } from './components/LearnAboutContentful';
import ModernStackOverview from 'components/shared/stack-onboarding/next_steps/ModernStackOverview';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { getStoragePrefix } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { ComposeAndLaunchCTA } from './components/ComposeAndLaunchCTA';
import { ContentfulAppsCTA } from './components/ContentfulAppsCTA';
import { FLAGS, getVariation } from 'core/feature-flags';
import { DiscoverOnboardingCTA } from 'features/onboarding';

const store = getBrowserStorage();

export const ModernStackAdminSpaceHome = ({
  spaceId,
  orgId,
  managementToken,
  entry,
  isSupportEnabled,
  hasTeamsEnabled,
  inviteCardExperimentEnabled,
}) => {
  const prefix = getStoragePrefix();
  const deploymentProvider = store.get(`${prefix}:deploymentProvider`);
  const [isRecoverableOnboardingEnabled, setIsRecoverableOnboardingEnabled] = useState(false);
  const [isNewOnboardingEnabled, setIsNewOnboardingEnabled] = useState(false);

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

      setIsRecoverableOnboardingEnabled(recoverableOnboardingEnabled);
      setIsNewOnboardingEnabled(newOnboardingExperimentVariation);
    })();
  }, [spaceId, orgId]);

  return (
    <WidgetContainer>
      <WidgetContainer.Row>
        <WidgetContainer.Col>
          {managementToken && entry && deploymentProvider ? (
            <>
              <Heading className={styles.header}>
                Congratulations on deploying the{' '}
                <span className={styles.demiBold}>Gatsby Starter for Contentful</span> blog
              </Heading>
              <Subheading className={styles.description}>
                {
                  'Use this space to continue to explore the blog— make updates through an API call and automate rebuilds by setting up a webhook.'
                }
              </Subheading>
            </>
          ) : (
            <>
              <Heading className={styles.header}>
                Welcome to your{' '}
                <span className={styles.demiBold}>Gatsby Starter for Contentful</span> blog space
              </Heading>
              {isNewOnboardingEnabled && (
                <Subheading className={styles.description}>
                  {
                    'To become familiar with our API and content modelling, create a space on top of our code sample.'
                  }
                </Subheading>
              )}
            </>
          )}
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      {isRecoverableOnboardingEnabled && isNewOnboardingEnabled && (
        <WidgetContainer.Row>
          <DiscoverOnboardingCTA spaceId={spaceId} />
        </WidgetContainer.Row>
      )}

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <ModernStackOverview
            spaceId={spaceId}
            entry={entry}
            managementToken={managementToken}
            deploymentProvider={deploymentProvider}
          />
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      <ContentfulAppsCTA />
      <ComposeAndLaunchCTA />

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

ModernStackAdminSpaceHome.propTypes = {
  orgId: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
  managementToken: PropTypes.string,
  entry: PropTypes.object,
  isSupportEnabled: PropTypes.bool.isRequired,
  hasTeamsEnabled: PropTypes.bool.isRequired,
  inviteCardExperimentEnabled: PropTypes.bool,
};
