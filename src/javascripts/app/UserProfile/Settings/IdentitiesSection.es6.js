import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Heading,
  IconButton,
  Tooltip,
  ModalConfirm,
  Paragraph
} from '@contentful/forma-36-react-components';
import { oauthUrl } from 'Config.es6';
import { difference, isArray, upperFirst, isEmpty, xor, find } from 'lodash';
import GithubIcon from 'svg/github-icon.es6';
import GoogleIcon from 'svg/google-icon.es6';
import TwitterIcon from 'svg/twitter-icon.es6';
import { deleteUserIdentityData } from './AccountService.es6';

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
    width: '130px',
    height: '42px',
    position: 'relative',
    marginRight: tokens.spacingS,
    svg: {
      position: 'absolute',
      top: '7px',
      left: '20px'
    }
  }),
  providerName: css({
    fontSize: tokens.fontSizeM,
    position: 'absolute',
    top: '11px',
    right: '30px'
  }),
  identityInput: css({
    border: 'none',
    fontSize: tokens.fontSizeM,
    position: 'absolute',
    backgroundColor: 'rgb(255, 255, 255, 0)',
    height: '100%',
    width: '100%',
    paddingLeft: '25px'
  }),
  cursorPointer: css({
    cursor: 'pointer'
  }),
  github: css({
    border: `1px solid ${tokens.colorElementDarkest}`,
    color: tokens.colorTextDark,
    'input[type="submit"]': {
      color: tokens.colorTextDark
    }
  }),
  google: css({
    border: `1px solid ${tokens.colorRedLight}`,
    color: tokens.colorRedDark,
    'input[type="submit"]': {
      color: tokens.colorRedDark
    }
  }),
  twitter: css({
    border: `1px solid ${tokens.colorBlueLight}`,
    color: tokens.colorBlueDark,
    'input[type="submit"]': {
      color: tokens.colorBlueDark
    }
  }),
  tooltipTargetWrapper: css({ display: 'flex' })
};

const identitiesProviders = ['google', 'github', 'twitter'];
const addProviderControls = {
  google: <AddIdentityProvider key="google_oauth2" id="google_oauth2" name="google" />,
  github: <AddIdentityProvider key="github" id="github" name="github" />,
  twitter: <AddIdentityProvider key="twitter" id="github" name="twitter" />
};

const IdentitiesSection = ({ userIdentities }) => {
  const getIdentitiesState = userIdentities => {
    const connectedIdentities =
      isArray(userIdentities) && userIdentities.map(identity => identity.provider);
    const unconnectedIdentities = difference(identitiesProviders, connectedIdentities);
    return { connectedIdentities, unconnectedIdentities };
  };
  const getUpdatedState = (providerName, connectedIdentities, unconnectedIdentities) => {
    const newConnectedIdentities = xor(connectedIdentities, [providerName]);
    const newUnconnectedIdentities = [...unconnectedIdentities, providerName];
    return {
      connectedIdentities: newConnectedIdentities,
      unconnectedIdentities: newUnconnectedIdentities
    };
  };
  const [{ connectedIdentities, unconnectedIdentities }, setState] = useState(
    getIdentitiesState(userIdentities)
  );

  return isEmpty(connectedIdentities) ? (
    <>
      <Heading className={styles.heading}>Available open identities:</Heading>
      <div className={styles.identitiesRow}>
        {identitiesProviders.map(provider => addProviderControls[provider])}
      </div>
    </>
  ) : (
    <>
      <Heading className={styles.heading}>Connected open Identities:</Heading>
      {connectedIdentities.map((providerName, index) => {
        const identityData = find(userIdentities, i => i.provider === providerName);
        return (
          <RemoveIdentityProvider
            onRemove={providerName =>
              setState(getUpdatedState(providerName, connectedIdentities, unconnectedIdentities))
            }
            key={index}
            identityId={identityData.sys.id}
            name={identityData.provider}
          />
        );
      })}
      <Heading className={styles.heading}>Open Identities:</Heading>
      <div className={styles.identitiesRow}>
        {unconnectedIdentities.map(provider => addProviderControls[provider])}
      </div>
    </>
  );
};
IdentitiesSection.propTypes = {
  userIdentities: PropTypes.any
};

export default IdentitiesSection;

function RemoveIdentityProvider({ onRemove, identityId, name }) {
  const [isShown, setShown] = useState(false);
  const onDelete = (id, name) => {
    deleteUserIdentityData(id);
    onRemove(name);
  };
  return (
    <div className={styles.identitiesRow}>
      <div className={cx(styles[name], styles.identityItem)}>
        <IdentityIcon providerName={name} />
        <div className={styles.providerName}>{upperFirst(name)}</div>
      </div>
      <Tooltip
        place="right"
        id={`remove-${name}-${identityId}`}
        content="Remove identity"
        targetWrapperClassName={styles.tooltipTargetWrapper}>
        <IconButton
          iconProps={{
            icon: 'Close'
          }}
          label={`Remove "${name}" open identity`}
          buttonType="secondary"
          onClick={() => setShown(true)}
          testId={`remove-${name}-button`}
        />
      </Tooltip>
      <ModalConfirm
        isShown={isShown}
        title="Remove identity"
        intent="negative"
        size="small"
        shouldCloseOnEscapePress
        shouldCloseOnOverlayClick
        testId={`dialog-remove-${name}-identity`}
        confirmTestId={`confirm-remove-${name}-identity`}
        cancelTestId={`cancel-remove-${name}-identity`}
        onCancel={() => {
          setShown(false);
        }}
        onConfirm={() => {
          setShown(false);
          onDelete(identityId.toString(), name);
        }}>
        <Paragraph>Are you sure you want to remove this open identity from your account?</Paragraph>
      </ModalConfirm>
    </div>
  );
}

RemoveIdentityProvider.propTypes = {
  identityId: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired
};

function AddIdentityProvider({ id, name }) {
  return (
    <form action={oauthUrl(id, '/account/user/profile')} method="post">
      <div className={cx(styles[name], styles.identityItem)}>
        <IdentityIcon providerName={name} />
        <input
          className={cx(styles.identityInput, styles.cursorPointer)}
          type="submit"
          value={upperFirst(name)}
          name="Add Identity Provider"
        />
      </div>
    </form>
  );
}

AddIdentityProvider.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
};

function IdentityIcon({ providerName }) {
  switch (providerName) {
    case 'github':
      return <GithubIcon />;
    case 'google':
      return <GoogleIcon />;
    case 'twitter':
      return <TwitterIcon />;
    default:
      return null;
  }
}

IdentityIcon.propTypes = {
  providerName: PropTypes.oneOf(['github', 'google', 'twitter']).isRequired
};
