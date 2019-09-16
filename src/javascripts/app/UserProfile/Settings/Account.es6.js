import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  IconButton,
  Modal,
  SkeletonContainer,
  SkeletonImage,
  SkeletonBodyText,
  Button,
  Typography
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';
import useAsync from 'app/common/hooks/useAsync.es6';
import { fetchUserData } from './AccountService.es6';
import IdentitiesSection from './IdentitiesSection.es6';

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

export default function AccountDetailsContainer() {
  const getUserData = useCallback(async () => {
    return await fetchUserData();
  }, []);

  const { isLoading, data: userAccountData } = useAsync(getUserData);

  return isLoading ? <AccountDetailsSkeleton /> : <AccountDetails data={userAccountData} />;
}

function AccountDetails({ data }) {
  const { firstName, lastName, avatarUrl, email, identities } = data;
  const [showModal, setShowModal] = React.useState(false);

  return (
    <div className={styles.paddingS}>
      <section className={styles.flexContainer}>
        <div className={cx(styles.column, styles.flexGrow1)}>
          <Heading>Account</Heading>
          <div className={cx(styles.flexContainer, styles.paddingTopS)}>
            <img
              className={styles.accountImage}
              alt={`${firstName}'s profile image`}
              src={avatarUrl}
            />
            <Typography className={cx(styles.column, styles.paddingLeftL)}>
              <span className={styles.name}>{firstName}</span>
              <span className={styles.name}>{lastName}</span>
              <span className={styles.email}>{email}</span>
              <span className={styles.password}>********</span>
            </Typography>
          </div>
        </div>

        <div className={styles.column}>
          <IconButton
            label="Edit user account details"
            iconProps={{ icon: 'Edit' }}
            buttonType="muted"
            onClick={() => setShowModal(true)}
            testId="edit-user-account-details"
          />
          <AccountEditorModal showModal={showModal} setShowModal={setShowModal} />
        </div>
      </section>
      <IdentitiesSection userIdentities={identities} />
    </div>
  );
}

AccountDetails.propTypes = {
  data: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    avatarUrl: PropTypes.string,
    email: PropTypes.string,
    identities: PropTypes.array
  }).isRequired
};

function AccountEditorModal({ showModal, setShowModal }) {
  return (
    <Modal
      title="Edit account details"
      shouldCloseOnEscapePress={true}
      shouldCloseOnOverlayClick={true}
      isShown={showModal}
      onClose={() => setShowModal(false)}>
      {({ title, onClose }) => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>EDIT ACCOUNT</Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} buttonType="positive">
              Confirm
            </Button>
            <Button onClick={onClose} buttonType="muted">
              Close
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

AccountEditorModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired
};

function AccountDetailsSkeleton() {
  return (
    <SkeletonContainer clipId="account-details-skeleton">
      <SkeletonImage />
      <SkeletonBodyText className={styles.spaceLeft} numberOfLines={3} />
    </SkeletonContainer>
  );
}
