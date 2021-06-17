import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import {
  Button,
  Heading,
  Card,
  Paragraph,
  ModalLauncher,
  Grid,
  Flex,
} from '@contentful/forma-36-react-components';
import { appsMarketingUrl } from 'Config';
import { StartAppTrialModal, useAppsTrial } from 'features/trials';
import { PRESELECT_VALUES } from 'features/space-purchase';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { CancelAppsSubscriptionModal } from './CancelAppsSubscriptionModal';
import { useRouteNavigate } from 'core/react-routing';

const styles = {
  card: css({ height: '100%', display: 'flex' }),
};

const openCancelAppsSubscriptionModal = (organizationId, addOnPlan) => {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <CancelAppsSubscriptionModal
      isShown={isShown}
      onClose={onClose}
      organizationId={organizationId}
      addOnPlan={addOnPlan}
    />
  ));
};

function getDescriptionText(addOnPlan, isTrialActive) {
  if (addOnPlan) {
    return (
      <>
        Content teams work faster and collaborate more effectively with these powerful new tools.
        Compose + Launch can be installed on any space home.
      </>
    );
  }

  if (!isTrialActive) {
    return (
      <>
        Give editors more independence to create and publish content with Compose + Launch.
        Developers will spend less time helping others and more time building.
      </>
    );
  }

  return (
    <>Install Compose + Launch on any Space by following the instructions on the Space Home.</>
  );
}

export function ContentfulApps({ organizationId, startAppTrial, addOnPlan }) {
  const { canStartTrial, isAppsTrialActive, hasAppsTrialExpired } = useAppsTrial(organizationId);
  const showStartTrialButton = canStartTrial;
  const showBuyButton = isAppsTrialActive || hasAppsTrialExpired;
  const routeNavigate = useRouteNavigate();

  const showPurchase = () => {
    routeNavigate({
      path: 'organizations.subscription.new_space',
      orgId: organizationId,
      navigationState: {
        preselect: PRESELECT_VALUES.APPS,
        from: 'subscription',
      },
    });
  };

  const showModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <StartAppTrialModal isShown={isShown} onClose={onClose} onConfirm={startAppTrial} />
    ));
  };

  return (
    <Card className={styles.card} testId="contentful-apps-card">
      <Grid rows="auto 1fr 40px">
        <Flex marginBottom="spacingM">
          {!isAppsTrialActive && <Heading testId="apps-header">Compose + Launch</Heading>}
          {isAppsTrialActive && <Heading testId="apps-trial-header">Contentful Apps trial</Heading>}
        </Flex>
        <Flex flexDirection="column" marginBottom="spacingXs">
          <Paragraph>{getDescriptionText(addOnPlan, isAppsTrialActive)}</Paragraph>
        </Flex>
        <Flex justifyContent="space-between" alignItems="center">
          {(!!addOnPlan || !isAppsTrialActive) && (
            <ExternalTextLink href={appsMarketingUrl}>Learn more</ExternalTextLink>
          )}
          {!!addOnPlan && (
            <Button
              testId="subscription-page.delete-apps"
              buttonType="muted"
              onClick={() => openCancelAppsSubscriptionModal(organizationId, addOnPlan)}>
              Cancel subscription
            </Button>
          )}
          {!addOnPlan && showStartTrialButton && (
            <Button
              size="small"
              buttonType="muted"
              onClick={showModal}
              data-test-id="start-trial-button">
              Start free trial
            </Button>
          )}
          {!addOnPlan && showBuyButton && (
            <Button
              size="small"
              buttonType="muted"
              onClick={showPurchase}
              data-test-id="buy-now-button">
              Buy now
            </Button>
          )}
        </Flex>
      </Grid>
    </Card>
  );
}

ContentfulApps.propTypes = {
  // Organization Id
  organizationId: PropTypes.string,
  // Function that handles what happens after we confirm the Start of a Trial inside the Modal
  startAppTrial: PropTypes.func.isRequired,
  // Check whether addon has been purchased
  addOnPlan: PropTypes.object,
};
