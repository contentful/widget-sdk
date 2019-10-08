import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Heading,
  IconButton,
  Tooltip,
  ModalConfirm,
  Paragraph,
  Notification
} from '@contentful/forma-36-react-components';
import { oauthUrl } from 'Config.es6';
import GithubIcon from 'svg/github-icon.es6';
import GoogleIcon from 'svg/google-icon.es6';
import TwitterIcon from 'svg/twitter-icon.es6';
import { deleteUserIdentityData } from './AccountRepository';

const styles = {
  heading: css({
    fontSize: tokens.fontSizeL,
    fontWeight: tokens.fontWeightMedium,
    marginTop: tokens.spacingL
  }),
  identitiesRow: css({
    display: 'flex',
    marginTop: tokens.spacingS
  }),
  identityItem: css({
    width: '135px',
    height: '42px',
    position: 'relative',
    marginRight: tokens.spacingS,
    svg: {
      position: 'absolute',
      top: '8px',
      left: '27px'
    }
  }),
  providerName: css({
    fontSize: tokens.fontSizeM,
    position: 'absolute',
    top: '11px',
    left: '60px'
  }),
  identityInput: css({
    border: 'none',
    fontSize: tokens.fontSizeM,
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    height: '100%',
    width: '100%',
    paddingLeft: '42px'
  }),
  cursorPointer: css({
    cursor: 'pointer'
  }),
  github: css({
    border: `1px solid #ADADAD`,
    color: tokens.colorTextDark,
    'input[type="submit"]': {
      color: tokens.colorTextDark
    }
  }),
  google_oauth2: css({
    border: `1px solid #E5ADA3`,
    color: tokens.colorRedDark,
    'input[type="submit"]': {
      color: tokens.colorRedDark
    }
  }),
  twitter: css({
    border: `1px solid #A8CFF1`,
    color: tokens.colorBlueDark,
    'input[type="submit"]': {
      color: tokens.colorBlueDark
    }
  }),
  tooltipTargetWrapper: css({ display: 'flex' })
};

const idpMap = {
  google_oauth2: 'Google',
  github: 'Github',
  twitter: 'Twitter'
};

const IdentitiesSection = ({ userHasPassword, identities, onRemoveIdentity }) => {
  const availableProviders = Object.keys(idpMap).filter(
    providerName => !identities.find(({ provider: usedProvider }) => providerName === usedProvider)
  );

  return (
    <div data-test-id="identities-section">
      {identities.length ? (
        <>
          <Heading className={styles.heading}>Connected open identities:</Heading>
          {identities.map(({ provider, sys: { id: identityId } }) => {
            return (
              <RemoveIdentityProvider
                onRemove={onRemoveIdentity}
                key={provider}
                identityId={identityId}
                provider={provider}
                disallowRemoval={!userHasPassword && identities.length === 1}
              />
            );
          })}
        </>
      ) : null}
      {availableProviders.length ? (
        <>
          <Heading className={styles.heading}>Available open identities:</Heading>
          <div className={styles.identitiesRow}>
            {availableProviders.map(provider => {
              return <AddIdentityProvider key={provider} provider={provider} />;
            })}
          </div>
        </>
      ) : null}
    </div>
  );
};
IdentitiesSection.propTypes = {
  identities: PropTypes.array,
  onRemoveIdentity: PropTypes.func.isRequired,
  userHasPassword: PropTypes.bool.isRequired
};

export default IdentitiesSection;

function RemoveIdentityProvider({ onRemove, identityId, provider, disallowRemoval }) {
  const humanName = idpMap[provider];

  const [isModalShown, setModalShown] = useState(false);

  const removeIdentity = async identityId => {
    // identityIds are, weirdly, numbers, so they must be cast to string before making
    // the API call
    try {
      await deleteUserIdentityData(identityId.toString());
    } catch (_) {
      Notification.error(`An error occurred while removing ${humanName} from your profile.`);

      return;
    }

    onRemove(identityId);

    Notification.success(`${humanName} successfully removed from your profile.`);
  };

  return (
    <div className={styles.identitiesRow}>
      <div className={cx(styles[provider], styles.identityItem)}>
        <IdentityIcon provider={provider} />
        <div className={styles.providerName}>{humanName}</div>
      </div>
      {!disallowRemoval && (
        <>
          <Tooltip
            place="right"
            id={`remove-${provider}-${identityId}`}
            content="Remove identity"
            targetWrapperClassName={styles.tooltipTargetWrapper}>
            <IconButton
              iconProps={{
                icon: 'Close'
              }}
              label={`Remove "${humanName}"`}
              buttonType="secondary"
              onClick={() => setModalShown(true)}
              testId={`remove-${provider}-button`}
            />
          </Tooltip>
          <ModalConfirm
            isShown={isModalShown}
            title="Remove identity"
            intent="negative"
            size="small"
            shouldCloseOnEscapePress
            shouldCloseOnOverlayClick
            testId={`dialog-remove-${provider}-identity`}
            confirmTestId={`confirm-remove-${provider}-identity`}
            cancelTestId={`cancel-remove-${provider}-identity`}
            onCancel={() => {
              setModalShown(false);
            }}
            onConfirm={() => {
              setModalShown(false);
              removeIdentity(identityId);
            }}>
            <Paragraph>
              Are you sure you want to remove this open identity from your account?
            </Paragraph>
          </ModalConfirm>
        </>
      )}
    </div>
  );
}

RemoveIdentityProvider.propTypes = {
  identityId: PropTypes.number.isRequired,
  provider: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
  disallowRemoval: PropTypes.bool.isRequired
};

function AddIdentityProvider({ provider }) {
  const humanName = idpMap[provider];

  return (
    <form
      data-test-id={`add-${provider}-identity-form`}
      action={oauthUrl(provider, '/account/user/profile')}
      method="post">
      <div className={cx(styles[provider], styles.identityItem)}>
        <IdentityIcon provider={provider} />
        <input
          className={cx(styles.identityInput, styles.cursorPointer)}
          type="submit"
          value={humanName}
          name="Add Identity Provider"
        />
      </div>
    </form>
  );
}

AddIdentityProvider.propTypes = {
  provider: PropTypes.string.isRequired
};

function IdentityIcon({ provider }) {
  switch (provider) {
    case 'github':
      return <GithubIcon />;
    case 'google_oauth2':
      return <GoogleIcon />;
    case 'twitter':
      return <TwitterIcon />;
    default:
      return null;
  }
}

IdentityIcon.propTypes = {
  provider: PropTypes.oneOf(['github', 'google_oauth2', 'twitter']).isRequired
};
