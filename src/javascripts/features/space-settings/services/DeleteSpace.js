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
import { Space as SpacePropType } from 'app/OrganizationSettings/PropTypes';
import ReloadNotification from 'app/common/ReloadNotification';

export const DeleteSpaceModal = ({ isShown, onClose, space }) => {
  const [spaceNameConfirmation, setSpaceNameConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await remove(space);
    } catch {
      Notification.error(`Failed to delete ${space.name}. Try again.`);
      setDeleting(false);

      return;
    }

    try {
      await TokenStore.refresh();
    } catch {
      // Close the current modal and instruct the user to reload. TokenStore.refresh shouldn't fail, but if it does,
      // there's not much we can do about it in the current session.
      onClose(false);
      ReloadNotification.trigger();

      return;
    }

    Notification.success(`Space ${space.name} deleted successfully.`);

    onClose(true);
  };

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
                You are about to remove the space <b>{space.name}</b>.
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
              onClick={handleDelete}
              buttonType="negative"
              loading={deleting}
              disabled={!(spaceNameConfirmation === space.name) || deleting}>
              Remove
            </Button>
            <Button
              testId="delete-space-cancel-button"
              onClick={() => onClose(false)}
              disabled={deleting}
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
  space: SpacePropType.isRequired,
};

export async function openDeleteSpaceDialog({ space, plan, onSuccess }) {
  if (plan && isEnterprisePlan(plan) && !isFreeSpacePlan(plan)) {
    return openCommittedSpaceWarningDialog();
  }

  const modalKey = Date.now();

  const result = await ModalLauncher.open(({ isShown, onClose }) => (
    <DeleteSpaceModal key={modalKey} isShown={isShown} onClose={onClose} space={space} />
  ));

  if (result) {
    onSuccess();
  }
}

function remove(space) {
  const endpoint = createSpaceEndpoint(space.sys.id);
  const client = new APIClient(endpoint);

  return client.deleteSpace();
}
