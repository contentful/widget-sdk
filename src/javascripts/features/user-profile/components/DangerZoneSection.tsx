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

type singleOwnerOrganizations = UserData['userCancellationWarning']['singleOwnerOrganizations'];

const openDeleteUserModal = (singleOwnerOrganizations: singleOwnerOrganizations) => {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <DeleteUserModal
      isShown={isShown}
      onConfirm={() => cancelUser()}
      onCancel={onClose}
      singleOwnerOrganizations={singleOwnerOrganizations}
    />
  ));
};

interface DangerZoneSectionProps {
  singleOwnerOrganizations: singleOwnerOrganizations;
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
