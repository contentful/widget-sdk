import React from 'react';
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
} from '@contentful/forma-36-react-components';
import { DeleteAppsModal } from './DeleteAppsModal';
import { css } from 'emotion';

const styles = {
  dropdown: css({
    // position: 'absolute',
    // right: tokens.spacingM,
  }),
};

const openDeleteAppsModal = async () => {
  const result = await ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <DeleteAppsModal onConfirm={onClose} onCancel={() => onClose(false)} isShown={isShown} />
    );
  });
  if (result === false) {
    return;
  }
};

export function ContentfulApps() {
  const [isOpen, setOpen] = React.useState(false);
  const handleAction = (action) => {
    setOpen(false);
    action();
  };

  return (
    <Card>
      <Heading>Compose + Launch</Heading>
      <Dropdown
        className={styles.dropdown}
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
          <DropdownListItem
            testId="userlist.row.actions.reinvite"
            onClick={() => handleAction(openDeleteAppsModal())}>
            Remove apps from organization
          </DropdownListItem>
        </DropdownList>
      </Dropdown>
      <Paragraph>Install the apps on any Space Home.</Paragraph>
    </Card>
  );
}
