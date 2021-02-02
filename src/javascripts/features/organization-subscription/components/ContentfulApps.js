import React, { useState } from 'react';
import _ from 'lodash';
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

const openDeleteAppsModal = async () => {
  const result = await ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <DeleteAppsModal
        onConfirm={() => {
          console.log('remove everything');
          onClose(false);
        }}
        onCancel={() => onClose(false)}
        isShown={isShown}
      />
    );
  });
  if (result === false) {
    return;
  }
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
