import React from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Card,
  Paragraph,
  TextLink,
  ModalLauncher,
  Flex,
  Button,
} from '@contentful/forma-36-react-components';
import { StartAppTrialModal, isOrganizationOnTrial } from 'features/trials';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { beginSpaceCreation } from 'services/CreateSpace';

export function ContentfulAppsTrial({
  organization,
  startAppTrial,
  isPurchased,
  isTrialAvailable,
  isTrialActive,
  isTrialExpired,
}) {
  const orgIsOnTrialAndRoleIsMember =
    !isOwnerOrAdmin(organization) && isOrganizationOnTrial(organization);

  if (isPurchased || orgIsOnTrialAndRoleIsMember) {
    return null;
  }

  const showStartTrialButton = isTrialAvailable;
  const showBuyButton = isTrialActive || isTrialExpired;

  const showPurchase = () => {
    beginSpaceCreation(organization.sys.id);
  };

  const showModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <StartAppTrialModal isShown={isShown} onClose={onClose} onConfirm={startAppTrial} />
    ));
  };

  return (
    <Card data-test-id="contentful-apps-trial">
      <Flex justifyContent="space-between" marginBottom="spacingM">
        {!isTrialActive && <Heading>Compose + Launch</Heading>}
        {isTrialActive && <Heading>Contentful Apps trial</Heading>}
      </Flex>
      <Flex flexDirection="column" marginBottom="spacingXs">
        {!isTrialActive && (
          <Paragraph>
            Give editors more independence to create and publish content with Compose + Launch.
            Developers will spend less time helping others and more time building.
          </Paragraph>
        )}
        {isTrialActive && (
          <Paragraph>
            Install Compose + Launch on any Space by following the instructions on the Space Home.
          </Paragraph>
        )}
        {!isTrialActive && (
          <TextLink
            href="https://www.contentful.com/contentful-apps"
            target="_blank"
            rel="noopener noreferrer">
            Learn more
          </TextLink>
        )}
      </Flex>
      <Flex justifyContent="flex-end" alignItems="center">
        {showStartTrialButton && (
          <Button
            size="small"
            buttonType="muted"
            onClick={showModal}
            data-test-id="start-trial-button">
            Start free trial
          </Button>
        )}
        {showBuyButton && (
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

ContentfulAppsTrial.propTypes = {
  // Organization object
  organization: PropTypes.object.isRequired,
  // Function that handles what happens after we confirm the Start of a Trial inside the Modal
  startAppTrial: PropTypes.func.isRequired,
  // Check for whether Apps were already purchased
  isPurchased: PropTypes.bool.isRequired,
  // Check for if Trial is available
  isTrialAvailable: PropTypes.bool,
  // Check for active Trial
  isTrialActive: PropTypes.bool,
  // Check for expired Trial
  isTrialExpired: PropTypes.bool,
};
