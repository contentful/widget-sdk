import React from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Icon,
  Modal,
  Paragraph,
  Typography,
  SkeletonContainer,
  SkeletonImage,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  spaceLeft: css({
    marginLeft: tokens.spacingXs,
    cursor: 'pointer'
  }),
  accountDetailsSection: css({
    display: 'flex',
    '> img': {
      height: '100px',
      borderRadius: '50%',
      marginRight: tokens.spacingXl
    },
    '> * + *': {
      marginRight: tokens.spacingXs
    }
  }),
  userDetails: css({
    display: 'flex',
    flexDirection: 'column'
  })
};

export default function AccountDetailsContainer() {
  const [userAccountData, setUserAccountData] = React.useState({});
  const [isLoadingUserAccountData, setIsLoadingUserAccountData] = React.useState(true);

  // to mimic data loading
  React.useEffect(() => {
    setTimeout(() => {
      setUserAccountData({
        firstName: 'Joseph Gordon',
        lastName: 'Lewitt',
        profileImageUrl: 'https://avatars3.githubusercontent.com/u/635512?v=4',
        email: 'jgw@wat.omg',
        identities: []
      });

      setIsLoadingUserAccountData(false);
    }, 3000);
  }, []);

  return (
    <Typography>
      <Heading>Account</Heading>
      {isLoadingUserAccountData ? (
        <AccountDetailsSkeleton />
      ) : (
        <AccountDetails data={userAccountData} />
      )}
    </Typography>
  );
}

function AccountDetails({ data }) {
  const { firstName, lastName, profileImageUrl, email } = data;

  const [showUserNameEditModal, setShowUserNameEditModal] = React.useState(false);
  const [showUserEmailEditModal, setShowUserEmailEditModal] = React.useState(false);

  return (
    <section className={styles.accountDetailsSection}>
      <img alt={`${firstName}'s profile image`} src={profileImageUrl} />

      <div className={styles.userDetails}>
        <Typography>
          <Paragraph>
            {firstName} {lastName}{' '}
            <Icon
              icon="Edit"
              size="small"
              color="primary"
              className={styles.spaceLeft}
              onClick={() => setShowUserNameEditModal(true)}
            />
            <Modal
              title="Edit user name"
              shouldCloseOnEscapePress={true}
              shouldCloseOnOverlayClick={true}
              isShown={showUserNameEditModal}
              onClose={() => setShowUserNameEditModal(false)}>
              <Typography>
                <Heading>Boop</Heading>
              </Typography>
            </Modal>
          </Paragraph>
        </Typography>
        <Typography>
          <Paragraph>
            {email}{' '}
            <Icon
              icon="Edit"
              size="small"
              color="primary"
              className={styles.spaceLeft}
              onClick={() => setShowUserEmailEditModal(true)}
            />
            <Modal
              title="Edit user email"
              shouldCloseOnEscapePress={true}
              shouldCloseOnOverlayClick={true}
              isShown={showUserEmailEditModal}
              onClose={() => setShowUserEmailEditModal(false)}>
              <Typography>
                <Heading>Email and stuff</Heading>
              </Typography>
            </Modal>
          </Paragraph>
        </Typography>
      </div>
    </section>
  );
}

AccountDetails.propTypes = {
  data: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    profileImageUrl: PropTypes.string,
    email: PropTypes.string
  }).isRequired
};

function AccountDetailsSkeleton() {
  return (
    <SkeletonContainer clipId="account-details-skeleton">
      <SkeletonImage />
      <SkeletonBodyText className={styles.spaceLeft} numberOfLines={3} />
    </SkeletonContainer>
  );
}
