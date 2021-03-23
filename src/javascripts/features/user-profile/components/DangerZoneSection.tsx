import React from 'react';
import {
  Card,
  Heading,
  Button,
  ModalLauncher,
  Typography,
} from '@contentful/forma-36-react-components';

import { cancelUser } from 'Authentication';
import { DeleteUserModal } from './DeleteUserModal';

import type { UserData } from '../types';

const openDeleteUserModal = async (singleOwnerOrganizations) => {
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

interface DangerZoneSectionProps {
  singleOwnerOrganizations: UserData['userCancellationWarning']['singleOwnerOrganizations'];
}

export function DangerZoneSection({ singleOwnerOrganizations }: DangerZoneSectionProps) {
  return (
    <Card testId="danger-zone-section-card" padding="large">
      <Typography testId="danger-zone-section">
        <Heading>Danger zone</Heading>
        <Button
          testId="delete-cta"
          buttonType="negative"
          onClick={() => openDeleteUserModal(singleOwnerOrganizations)}>
          Delete my account
        </Button>
      </Typography>
    </Card>
  );
}
