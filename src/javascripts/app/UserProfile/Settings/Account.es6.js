import React from 'react';
import { Heading, IconButton, Typography, Tooltip } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';
import { userAccountDataShape } from './AccountService.es6';
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
  const [showModal, setShowModal] = React.useState(false);
  const [userState, setUserState] = React.useState(data);

  return (
    <div data-test-id="user-account-data" className={styles.paddingS}>
      <section className={styles.flexContainer}>
        <div className={cx(styles.column, styles.flexGrow1)}>
          <Heading>Account</Heading>
          <div className={cx(styles.flexContainer, styles.paddingTopS)}>
            <img
              className={styles.accountImage}
              alt={`${userState.firstName}'s profile image`}
              src={userState.avatarUrl}
            />
            <Typography className={cx(styles.column, styles.paddingLeftL)}>
              <span className={styles.name}>{userState.firstName}</span>
              <span className={styles.name}>{userState.lastName}</span>
              <span className={styles.email}>{userState.email}</span>
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
            initialUserData={data}
            userState={userState}
            setUserState={setUserState}
            showModal={showModal}
            setShowModal={setShowModal}
          />
        </div>
      </section>
      <IdentitiesSection userIdentities={userState.identities} />
    </div>
  );
}

AccountDetails.propTypes = {
  data: userAccountDataShape.isRequired
};
