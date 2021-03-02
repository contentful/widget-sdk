import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Card,
  Paragraph,
  IconButton,
  Dropdown,
  DropdownList,
  DropdownListItem,
  ModalLauncher,
  Flex,
} from '@contentful/forma-36-react-components';
import { DeleteAppsModal } from './DeleteAppsModal';

const openDeleteAppsModal = (organizationId, addOnPlan) => {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <DeleteAppsModal
      isShown={isShown}
      onClose={onClose}
      organizationId={organizationId}
      addOnPlan={addOnPlan}
    />
  ));
};

export function ContentfulApps({ organizationId, addOnPlan }) {
  const [isOpen, setOpen] = useState(false);

  const openModal = () => {
    setOpen(false);
    openDeleteAppsModal(organizationId, addOnPlan);
  };

  return (
    <Card>
      <Flex justifyContent="space-between" marginBottom="spacingM">
        <Heading>Compose + Launch</Heading>
        <Dropdown
          isOpen={isOpen}
          onClose={() => setOpen(false)}
          toggleElement={
            <IconButton
              testId="subscription-page.delete-apps"
              onClick={() => {
                setOpen(true);
              }}
              label="Actions"
              iconProps={{
                icon: 'MoreHorizontal',
              }}
              buttonType="muted"
            />
          }>
          <DropdownList>
            <DropdownListItem testId="userlist.row.actions.reinvite" onClick={openModal}>
              Cancel your Compose + Launch subscription
            </DropdownListItem>
          </DropdownList>
        </Dropdown>
      </Flex>
      <Paragraph>
        Install Compose + Launch on any space by following the instructions on your Space Home.
      </Paragraph>
    </Card>
  );
}

ContentfulApps.propTypes = {
  organizationId: PropTypes.string.isRequired,
  addOnPlan: PropTypes.object.isRequired,
};
