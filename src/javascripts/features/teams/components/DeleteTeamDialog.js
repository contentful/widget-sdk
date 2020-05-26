import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Paragraph, Notification } from '@contentful/forma-36-react-components';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { removeTeam } from '../services/TeamRepo';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes';
import * as Navigator from 'states/Navigator';

DeleteTeamDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialTeam: TeamPropType,
};

export function DeleteTeamDialog({ onClose, isShown, initialTeam }) {
  const path = ['account', 'organizations', 'teams'];

  const onConfirm = async () => {
    const endpoint = createOrganizationEndpoint(initialTeam.sys.organization.sys.id);
    try {
      await removeTeam(endpoint, initialTeam.sys.id);
      Notification.success(`Successfully removed team ${initialTeam.name}`);
      Navigator.go({ path });
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
