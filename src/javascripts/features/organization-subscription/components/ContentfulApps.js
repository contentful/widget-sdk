import React, { useState } from 'react';
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

const openDeleteAppsModal = () => {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <DeleteAppsModal isShown={isShown} onClose={onClose} />
  ));
};

export function ContentfulApps() {
  const [isOpen, setOpen] = useState(false);

  const openModal = () => {
    setOpen(false);
    openDeleteAppsModal();
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
              Remove apps from organization
            </DropdownListItem>
          </DropdownList>
        </Dropdown>
      </Flex>
      <Paragraph>Install the apps on any Space Home.</Paragraph>
    </Card>
  );
}
