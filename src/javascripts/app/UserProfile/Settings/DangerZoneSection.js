import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Button, Typography } from '@contentful/forma-36-react-components';
import { cancelUser } from 'Authentication';
import * as ModalLauncher from 'app/common/ModalLauncher';
import DeleteUserModal from './DeleteUserModal';

const openDeleteUserModal = async singleOwnerOrganizations => {
  const result = await ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <DeleteUserModal
        isShown={isShown}
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}
        singleOwnerOrganizations={singleOwnerOrganizations}
      />
    );
  });

  if (result === false) {
    return;
  }

  cancelUser();
};

export default function DangerZoneSection({ singleOwnerOrganizations }) {
  return (
    <Typography testId="danger-zone-section">
      <Heading>Danger zone</Heading>
      <Button
        testId="delete-cta"
        buttonType="negative"
        onClick={() => openDeleteUserModal(singleOwnerOrganizations)}>
        Delete my account
      </Button>
    </Typography>
  );
}

DangerZoneSection.propTypes = {
  singleOwnerOrganizations: PropTypes.array.isRequired
};
