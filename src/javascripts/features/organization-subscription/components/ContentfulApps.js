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

import { websiteUrl } from 'Config';
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

export function ContentfulApps({ organizationId, addOnPlan }) {
  return (
    <Card testId="contentful-apps-card">
      <Heading>Compose + Launch</Heading>
      <Flex marginTop="spacingM" marginBottom="spacingM">
        <Paragraph>
          Content teams work faster and collaborate more effectively with these powerful new tools.
          Compose + Launch can be installed on any space home.
        </Paragraph>
      </Flex>
      <Flex justifyContent="space-between">
        <ExternalTextLink href={websiteUrl('contentfulapps')}>Learn more</ExternalTextLink>
        <Button
          testId="subscription-page.delete-apps"
          buttonType="muted"
          onClick={() => openCancelAppsSubscriptionModal(organizationId, addOnPlan)}>
          Cancel subscription
        </Button>
      </Flex>
    </Card>
  );
}

ContentfulApps.propTypes = {
  organizationId: PropTypes.string.isRequired,
  addOnPlan: PropTypes.object.isRequired,
};
