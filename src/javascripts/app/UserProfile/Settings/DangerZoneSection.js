import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Button, Typography } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { cancelUser } from 'Authentication.es6';
import * as ModalLauncher from 'app/common/ModalLauncher.es6';
import DeleteUserModal from './DeleteUserModal';

const styles = {
  paddingS: css({ padding: tokens.spacingS })
};

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
    <Typography className={styles.paddingS}>
      <Heading>Danger zone</Heading>
      <Button
        testId="delete-account-button"
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
