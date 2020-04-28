import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Button,
  Dropdown,
  DropdownList,
  Typography,
  Paragraph,
} from '@contentful/forma-36-react-components';

const styles = {
  actionButton: css({
    marginLeft: tokens.spacingM,
  }),
  confirmation: css({
    width: '360px',
    textAlign: 'center',
    padding: tokens.spacingS,
  }),
};

export function KeyEditorActions(props) {
  const [isConfirmOpened, setConfirmationOpened] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const onDeleteClick = async () => {
    setDeleting(true);
    try {
      await props.onRemove();
      setConfirmationOpened(false);
    } finally {
      setDeleting(false);
    }
  };

  const onSaveClick = async () => {
    setSaving(true);
    try {
      await props.onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dropdown
        isOpen={isConfirmOpened}
        onClose={() => setConfirmationOpened(false)}
        position="bottom-left"
        toggleElement={
          <Button
            testId="apiKey.delete"
            onClick={() => {
              setConfirmationOpened(true);
            }}
            buttonType="muted"
            className={styles.actionButton}>
            Delete
          </Button>
        }>
        <DropdownList>
          <div className={styles.confirmation}>
            <Typography>
              <Paragraph>Are sure that you want to delete this API Key?</Paragraph>
            </Typography>
            <div>
              <Button
                buttonType="negative"
                onClick={onDeleteClick}
                testId="apiKey.deleteConfirm"
                loading={isDeleting}>
                Delete
              </Button>
              <Button
                buttonType="muted"
                className={styles.actionButton}
                onClick={() => {
                  setConfirmationOpened(false);
                }}>{`Don't delete`}</Button>
            </div>
          </div>
        </DropdownList>
      </Dropdown>
      <Button
        testId="apiKey.save"
        disabled={props.isSaveDisabled}
        buttonType="positive"
        onClick={onSaveClick}
        loading={isSaving}
        className={styles.actionButton}>
        Save
      </Button>
    </>
  );
}

KeyEditorActions.propTypes = {
  isDeleteDisabled: PropTypes.bool.isRequired,
  isSaveDisabled: PropTypes.bool.isRequired,
  onRemove: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};
