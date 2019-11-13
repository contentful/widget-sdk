import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles';
import { Heading, Subheading } from '@contentful/forma-36-react-components';
import WidgetContainer from './widgets/WidgetContainer';
import AccordionComponent from './components/AccordionComponent';
import GetSdkSection from './components/GetSdkSection';
import UpgradePricing from './UpgradePricing';
import LearnAboutContentful from './components/LearnAboutContentful';
import ContactAnExpertCTA from './components/ContactAnExpertCTA';
import ExtensionsCTA from './components/ExtensionsCTA';
import AddCoworkerCTA from './components/AddCoworkerCTA';

const AdminSpaceHome = ({ spaceName, spaceId, orgId, isSupportEnabled, hasTeamsEnabled }) => {
  return (
    <WidgetContainer>
      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <Heading className={styles.header}>
            Welcome to your <span className={styles.demiBold}>{spaceName}</span> space
          </Heading>
          <Subheading className={styles.description}>
            Use this space to create and publish content with others from your organization.
            <br />
            Explore ways to get started below.
          </Subheading>
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <UpgradePricing />
        </WidgetContainer.Col>
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
          <ExtensionsCTA />
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
  hasTeamsEnabled: PropTypes.bool.isRequired
};

export default AdminSpaceHome;
