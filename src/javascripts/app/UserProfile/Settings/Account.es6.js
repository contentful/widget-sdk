import React, { useState } from 'react';
import { Heading, IconButton, Typography, Tooltip } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';
import { User as UserPropType } from './propTypes';
import IdentitiesSection from './IdentitiesSection.es6';
import AccountEditorModal from './AccountEditorModal.es6';

const styles = {
  spaceLeft: css({
    marginLeft: tokens.spacingXs,
    cursor: 'pointer'
  }),
  paddingS: css({ padding: tokens.spacingS }),
  accountImage: css({
    height: '68px',
    width: '68px',
    marginTop: tokens.spacing2Xs,
    borderRadius: '50%'
  }),
  flexContainer: css({
    display: 'flex',
    flexWrap: 'nowrap'
  }),
  column: css({
    display: 'flex',
    flexDirection: 'column'
  }),
  flexGrow1: css({
    flexGrow: 1
  }),
  paddingLeftL: css({
    paddingLeft: tokens.spacingL
  }),
  paddingTopS: css({
    paddingTop: tokens.spacingS
  }),
  name: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeL,
    marginBottom: tokens.spacing2Xs
  }),
  email: css({
    marginTop: tokens.spacingXs,
    color: tokens.colorTextMid
  }),
  password: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeL,
    marginTop: tokens.spacingM
  })
};

export default function AccountDetails({ data }) {
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(data);

  return (
    <div data-test-id="user-account-data" className={styles.paddingS}>
      <section className={styles.flexContainer}>
        <div className={cx(styles.column, styles.flexGrow1)}>
          <Heading>Account</Heading>
          <div className={cx(styles.flexContainer, styles.paddingTopS)}>
            <img
              className={styles.accountImage}
              alt={`Profile image for ${user.firstName} ${user.lastName}`}
              src={user.avatarUrl}
            />
            <Typography className={cx(styles.column, styles.paddingLeftL)}>
              <span className={styles.name}>{user.firstName}</span>
              <span className={styles.name}>{user.lastName}</span>
              <span className={styles.email}>{user.email}</span>
              <span className={styles.password}>********</span>
            </Typography>
          </div>
        </div>

        <div className={styles.column}>
          <Tooltip place="bottom" id={`edit-user-account`} content="Edit account">
            <IconButton
              label="Edit user account details"
              iconProps={{ icon: 'Edit' }}
              buttonType="muted"
              onClick={() => setShowModal(true)}
              testId="edit-user-account-details"
            />
          </Tooltip>
          <AccountEditorModal
            user={user}
            onConfirm={updatedUser => {
              setUser(updatedUser);
              setShowModal(false);
            }}
            onCancel={() => setShowModal(false)}
            showModal={showModal}
          />
        </div>
      </section>
      <IdentitiesSection identities={user.identities} />
    </div>
  );
}

AccountDetails.propTypes = {
  data: UserPropType.isRequired
};
