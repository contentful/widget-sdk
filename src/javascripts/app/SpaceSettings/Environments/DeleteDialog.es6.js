import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import escape from 'utils/escape.es6';
import {
  Notification,
  ModalConfirm,
  Paragraph,
  Typography,
  TextInput
} from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import * as StateNavigator from 'states/Navigator.es6';

/**
 * @param runDelete
 *   Function that receives an environment, sends the delete request to
 *   the API and returns the result in a promise
 * @param environmentId
 *   ID of a environment to delete
 * @param activeEnvironmentId
 *   ID of a current environment
 */
export function openDeleteEnvironmentDialog(runDelete, environmentId, activeEnvironmentId) {
  const uniqueModalKey = Date.now();
  return ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <SpaceEnvironmentsDeleteDialog
        key={uniqueModalKey}
        isShown={isShown}
        runDelete={runDelete}
        confirmationId={environmentId}
        activeEnvironmentId={activeEnvironmentId}
        onConfirm={() => {
          onClose(true);
        }}
        onCancel={() => {
          onClose(false);
        }}
      />
    );
  });
}

function SpaceEnvironmentsDeleteDialogContent({ inputValue, setInputValue, confirmationId }) {
  const inputRef = useRef();

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      <Typography>
        <Paragraph>
          You are about to delete the environment <strong>{confirmationId}</strong>. All of the
          environment data, including the environment itself, will be deleted. This operation cannot
          be undone.
        </Paragraph>
      </Typography>
      <TextInput
        inputRef={inputRef}
        value={inputValue}
        onChange={e => {
          setInputValue(e.target.value);
        }}
        testId="confirmId"
        width="full"
      />
    </>
  );
}

SpaceEnvironmentsDeleteDialogContent.propTypes = {
  confirmationId: PropTypes.string.isRequired,
  inputValue: PropTypes.string,
  setInputValue: PropTypes.func.isRequired
};

function SpaceEnvironmentsDeleteDialog({
  isShown,
  confirmationId,
  activeEnvironmentId,
  onConfirm,
  onCancel,
  runDelete
}) {
  const [inputValue, setInputValue] = useState('');
  const [inProgress, setInProgress] = useState(false);

  const onDelete = async () => {
    setInProgress(true);
    try {
      await runDelete(confirmationId);
      if (confirmationId === activeEnvironmentId) {
        await StateNavigator.go({
          path: 'spaces.detail.settings.environments'
        });
        Notification.success(
          'The current environment has been successfully deleted, master will be loaded.'
        );
        setTimeout(() => window.location.reload(), 2000);
      } else {
        Notification.success(
          `The environment “${escape(confirmationId)}” has been successfully deleted.`
        );
      }
      setInProgress(false);
      onConfirm();
    } catch (e) {
      setInProgress(false);
      Notification.error(
        'Deleting failed, please try again. If the problem persists, contact support.'
      );
    }
  };

  return (
    <ModalConfirm
      shouldCloseOnOverlayClick={false}
      testId="spaceEnvironmentsDeleteDialog"
      isConfirmDisabled={inputValue !== confirmationId}
      isConfirmLoading={inProgress}
      confirmTestId="delete"
      confirmLabel="Delete environment"
      cancelTestId="cancel"
      isShown={isShown}
      intent="negative"
      title="Delete environment"
      onConfirm={onDelete}
      onCancel={onCancel}>
      <SpaceEnvironmentsDeleteDialogContent
        confirmationId={confirmationId}
        inputValue={inputValue}
        setInputValue={setInputValue}
      />
    </ModalConfirm>
  );
}

SpaceEnvironmentsDeleteDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  runDelete: PropTypes.func.isRequired,
  confirmationId: PropTypes.string.isRequired,
  activeEnvironmentId: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};
