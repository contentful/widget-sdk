import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Heading,
  Card,
  Paragraph,
  ModalLauncher,
  Flex,
} from '@contentful/forma-36-react-components';
import { appsMarketingUrl } from 'Config';
import { StartAppTrialModal } from 'features/trials';
import { go } from 'states/Navigator';
import { PRESELECT_VALUES } from 'features/space-purchase';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { CancelAppsSubscriptionModal } from './CancelAppsSubscriptionModal';

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

export function ContentfulApps({
  organizationId,
  startAppTrial,
  isTrialAvailable,
  isTrialActive,
  isTrialExpired,
  addOnPlan,
}) {
  const showStartTrialButton = isTrialAvailable;
  const showBuyButton = isTrialActive || isTrialExpired;

  const showPurchase = () => {
    go({
      path: ['account', 'organizations', 'subscription_new', 'new_space'],
      params: {
        orgId: organizationId,
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
    <Card testId="contentful-apps-card">
      <Flex marginBottom="spacingM">
        {!isTrialActive && <Heading testId="apps-header">Compose + Launch</Heading>}
        {isTrialActive && <Heading testId="apps-trial-header">Contentful Apps trial</Heading>}
      </Flex>
      <Flex flexDirection="column" marginBottom="spacingXs">
        <Paragraph>{getDescriptionText(addOnPlan, isTrialActive)}</Paragraph>
      </Flex>
      <Flex justifyContent="space-between" alignItems="center">
        {(!!addOnPlan || !isTrialActive) && (
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
    </Card>
  );
}

ContentfulApps.propTypes = {
  // Organization Id
  organizationId: PropTypes.string,
  // Function that handles what happens after we confirm the Start of a Trial inside the Modal
  startAppTrial: PropTypes.func.isRequired,
  // Check for if Trial is available
  isTrialAvailable: PropTypes.bool,
  // Check for active Trial
  isTrialActive: PropTypes.bool,
  // Check for expired Trial
  isTrialExpired: PropTypes.bool,
  // The purchased addOnPlan
  addOnPlan: PropTypes.object,
};
