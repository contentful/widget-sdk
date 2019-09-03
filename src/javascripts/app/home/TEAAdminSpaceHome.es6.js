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
import ExampleProjectOverview from './components/ExampleProjectOverview.es6';

const TEAAdminSpaceHome = ({
  spaceName,
  orgId,
  spaceId,
  cdaToken,
  cpaToken,
  isSupportEnabled,
  hasTeamsEnabled
}) => {
  return (
    <WidgetContainer>
      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <Heading className={styles.header}>
            Welcome to your <span className={styles.demiBold}>{spaceName}</span> space
          </Heading>
          <Subheading className={styles.description}>
            Use this space to explore the sample content of an educational course catalog.
            <br />
            After viewing the existing content, try modifying an entry.
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
                  <>
                    Modify sample content in <span className={styles.demiBold}>{spaceName}</span>
                  </>
                ),
                content: <ExampleProjectOverview cdaToken={cdaToken} cpaToken={cpaToken} />
              }
            ]}
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
TEAAdminSpaceHome.propTypes = {
  spaceName: PropTypes.string.isRequired,
  orgId: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
  cdaToken: PropTypes.string.isRequired,
  cpaToken: PropTypes.string.isRequired,
  isSupportEnabled: PropTypes.bool.isRequired,
  hasTeamsEnabled: PropTypes.bool.isRequired
};

export default TEAAdminSpaceHome;
