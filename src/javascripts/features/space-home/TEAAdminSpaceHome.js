import React from 'react';
import PropTypes from 'prop-types';
import { styles } from './styles';
import { Heading, Subheading } from '@contentful/forma-36-react-components';
import { AccordionComponent } from './components/AccordionComponent';
import { WidgetContainer } from './widgets/WidgetContainer';
import { ContactAnExpertCTA } from './components/ContactAnExpertCTA';
import { AddCoworkerCTA } from './components/AddCoworkerCTA';
import { GetSdkSection } from './components/GetSdkSection';
import { UpgradePricing } from './UpgradePricing';
import { LearnAboutContentful } from './components/LearnAboutContentful';
import { ExampleProjectOverview } from './components/ExampleProjectOverview';
import { SpaceTrialWidget } from 'features/trials';

export const TEAAdminSpaceHome = ({
  spaceName,
  orgId,
  spaceId,
  cdaToken,
  cpaToken,
  isSupportEnabled,
  hasTeamsEnabled,
  isTrialSpace,
  hasActiveAppTrial,
}) => {
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

      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <UpgradePricing />
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <SpaceTrialWidget spaceId={spaceId} hasActiveAppTrial={hasActiveAppTrial} />
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
TEAAdminSpaceHome.propTypes = {
  spaceName: PropTypes.string.isRequired,
  orgId: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
  cdaToken: PropTypes.string.isRequired,
  cpaToken: PropTypes.string.isRequired,
  isSupportEnabled: PropTypes.bool.isRequired,
  hasTeamsEnabled: PropTypes.bool.isRequired,
  isTrialSpace: PropTypes.bool,
  hasActiveAppTrial: PropTypes.bool,
};
