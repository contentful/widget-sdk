import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles.es6';
import { Heading, Subheading } from '@contentful/forma-36-react-components';
import AccordionComponent from './components/AccordionComponent.es6';
import WidgetContainer from './widgets/WidgetContainer.es6';
import ContactAnExpertCTA from './components/ContactAnExpertCTA.es6';
import AddCoworkerCTA from './components/AddCoworkerCTA.es6';
import GetSdkSection from './components/GetSdkSection.es6';
import UpgradePricing from './UpgradePricing.es6';
import LearnAboutContentful from './components/LearnAboutContentful.es6';
import ModernStackOverview from 'components/shared/stack-onboarding/next_steps/ModernStackOverview.es6';
import { getStore } from 'TheStore/index.es6';
import { getStoragePrefix } from 'components/shared/auto_create_new_space/CreateModernOnboarding.es6';

const store = getStore();

const ModernStackAdminSpaceHome = ({
  spaceId,
  orgId,
  managementToken,
  entry,
  isSupportEnabled,
  hasTeamsEnabled
}) => {
  const prefix = getStoragePrefix();
  const deploymentProvider = store.get(`${prefix}:deploymentProvider`);
  return (
    <WidgetContainer>
      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <Heading className={styles.header}>
            Congratulations on deploying the{' '}
            <span className={styles.demiBold}>Gatsby Starter for Contentful</span> blog
          </Heading>
          {managementToken && entry && deploymentProvider && (
            <Subheading className={styles.description}>
              {
                'Use this space to continue to explore the blog— make updates through an API call and automate rebuilds by setting up a webhook.'
              }
            </Subheading>
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
                content: <LearnAboutContentful />
              }
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
  hasTeamsEnabled: PropTypes.bool.isRequired
};

export default ModernStackAdminSpaceHome;
