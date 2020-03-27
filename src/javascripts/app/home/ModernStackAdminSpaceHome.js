import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles';
import { Heading, Subheading } from '@contentful/forma-36-react-components';
import AccordionComponent from './components/AccordionComponent';
import WidgetContainer from './widgets/WidgetContainer';
import ContactAnExpertCTA from './components/ContactAnExpertCTA';
import AddCoworkerCTA from './components/AddCoworkerCTA';
import GetSdkSection from './components/GetSdkSection';
import UpgradePricing from './UpgradePricing';
import LearnAboutContentful from './components/LearnAboutContentful';
import ModernStackOverview from 'components/shared/stack-onboarding/next_steps/ModernStackOverview';
import { getStore } from 'browserStorage';
import { getStoragePrefix } from 'components/shared/auto_create_new_space/CreateModernOnboarding';

const store = getStore();

const ModernStackAdminSpaceHome = ({
  spaceId,
  orgId,
  managementToken,
  entry,
  isSupportEnabled,
  hasTeamsEnabled,
}) => {
  const prefix = getStoragePrefix();
  const deploymentProvider = store.get(`${prefix}:deploymentProvider`);
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
            <Heading className={styles.header}>
              Welcome to your <span className={styles.demiBold}>Gatsby Starter for Contentful</span>{' '}
              blog space
            </Heading>
          )}
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <UpgradePricing />
        </WidgetContainer.Col>
      </WidgetContainer.Row>

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

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <AddCoworkerCTA spaceId={spaceId} orgId={orgId} hasTeamsEnabled={hasTeamsEnabled} />
        </WidgetContainer.Col>
        {isSupportEnabled && (
          <WidgetContainer.Col>
            <ContactAnExpertCTA />
          </WidgetContainer.Col>
        )}
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <AccordionComponent
            drawersContent={[
              {
                headerText: (
                  <span className={styles.demiBold}>Learn what’s possible with Contentful</span>
                ),
                content: <LearnAboutContentful />,
              },
            ]}
          />
        </WidgetContainer.Col>
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
};

export default ModernStackAdminSpaceHome;
