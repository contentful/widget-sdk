import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Notification,
  Modal,
  Paragraph,
  Typography,
  TextInput,
  Button,
} from '@contentful/forma-36-react-components';
import * as TokenStore from 'services/TokenStore';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { openModal as openCommittedSpaceWarningDialog } from 'components/shared/space-wizard/CommittedSpaceWarningModal';
import APIClient from 'data/APIClient';
import { isEnterprisePlan, isFreeSpacePlan } from 'account/pricing/PricingDataProvider';
import { ModalLauncher } from 'core/components/ModalLauncher';

export const DeleteSpaceModal = ({ isShown, onClose, spaceName }) => {
  const [spaceNameConfirmation, setSpaceNameConfirmation] = useState('');
  return (
    <Modal
      title="Remove space"
      isShown={isShown}
      onClose={() => onClose(false)}
      shouldCloseOnOverlayClick>
      {({ title }) => (
        <>
          <Modal.Header title={title} onClose={() => onClose(false)} />
          <Modal.Content>
            <Typography>
              <Paragraph>
                You are about to remove space <b>{spaceName}</b>.
              </Paragraph>
              <Paragraph>
                All space contents and the space itself will be removed. This operation cannot be
                undone.
              </Paragraph>
              <Paragraph>To confirm, type the name of the space in the field below:</Paragraph>
              <TextInput
                value={spaceNameConfirmation}
                onChange={({ target: { value } }) => setSpaceNameConfirmation(value)}
                testId="space-name-confirmation-field"
              />
            </Typography>
          </Modal.Content>
          <Modal.Controls>
            <Button
              testId="delete-space-confirm-button"
              onClick={() => onClose(true)}
              buttonType="negative"
              disabled={!(spaceNameConfirmation === spaceName)}>
              Remove
            </Button>
            <Button
              testId="delete-space-cancel-button"
              onClick={() => onClose(false)}
              buttonType="muted">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

DeleteSpaceModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  spaceName: PropTypes.string.isRequired,
};

export async function openDeleteSpaceDialog({ space, plan, onSuccess }) {
  if (plan && isEnterprisePlan(plan) && !isFreeSpacePlan(plan)) {
    return openCommittedSpaceWarningDialog();
  }

  const spaceName = space.name.trim();
  const modalKey = Date.now();

  const result = await ModalLauncher.open(({ isShown, onClose }) => (
    <DeleteSpaceModal key={modalKey} isShown={isShown} onClose={onClose} spaceName={spaceName} />
  ));

  if (result) {
    try {
      await remove(space);
      onSuccess();
    } catch {
      Notification.error(`Failed to delete ${space.name}.`);
    }
  }
}

function remove(space) {
  const endpoint = createSpaceEndpoint(space.sys.id);
  const client = new APIClient(endpoint);

  return client
    .deleteSpace()
    .then(TokenStore.refresh)
    .then(() => {
      Notification.success(`Space ${space.name} deleted successfully.`);
    });
}
