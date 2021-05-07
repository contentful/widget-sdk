import React from 'react';
import { Button, Modal, Notification, Paragraph } from '@contentful/forma-36-react-components';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { removeTeam } from '../services/TeamRepository';
import { Team } from '../types';
import { router } from 'core/react-routing';

export function DeleteTeamDialog({
  onClose,
  isShown,
  initialTeam,
}: {
  onClose: VoidFunction;
  isShown: boolean;
  initialTeam: Team;
}) {
  const onConfirm = async () => {
    const orgId = initialTeam.sys.organization.sys.id;
    const endpoint = createOrganizationEndpoint(orgId);
    try {
      await removeTeam(endpoint, initialTeam.sys.id);
      Notification.success(`Successfully removed team ${initialTeam.name}`);
      router.navigate({ path: 'organizations.teams', orgId });
    } catch {
      Notification.error(`Could not remove team ${initialTeam.name}`);
    }
    onClose();
  };

  return (
    <Modal isShown={isShown} onClose={onClose} testId="remove-team-dialog">
      {() => (
        <>
          <Modal.Header title={`Remove team ${initialTeam.name}`} onClose={onClose} />
          <Modal.Content>
            <Paragraph>{`Are you sure you want to remove the team ${initialTeam.name}?`}</Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button
              buttonType="negative"
              type="submit"
              testId="remove-team-button"
              onClick={onConfirm}>
              Remove
            </Button>
            <Button
              type="button"
              onClick={onClose}
              buttonType="muted"
              testId="close-delete-team-dialog-button">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}
