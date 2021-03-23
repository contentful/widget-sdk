import React, { useState } from 'react';
import { css, cx } from 'emotion';
import {
  Subheading,
  IconButton,
  Tooltip,
  ModalConfirm,
  Paragraph,
  Notification,
  Flex,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { oauthUrl } from 'Config';
import { deleteUserIdentityData } from 'app/UserProfile/Settings/AccountRepository';

import GithubIcon from 'svg/github-icon.svg';
import GoogleIcon from 'svg/google-icon.svg';
import TwitterIcon from 'svg/twitter-icon.svg';

import type { Identity } from '../types';

const styles = {
  identityItem: css({
    width: '135px',
    height: '42px',
    position: 'relative',
    marginRight: tokens.spacingS,
    svg: {
      position: 'absolute',
      top: '8px',
      left: '27px',
    },
  }),
  providerName: css({
    fontSize: tokens.fontSizeM,
    position: 'absolute',
    top: '11px',
    left: '60px',
  }),
  identityInput: css({
    border: 'none',
    fontSize: tokens.fontSizeM,
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    height: '100%',
    width: '100%',
    paddingLeft: '42px',
  }),
  cursorPointer: css({
    cursor: 'pointer',
  }),
  github: css({
    border: `1px solid #ADADAD`,
    color: tokens.colorTextDark,
    'input[type="submit"]': {
      color: tokens.colorTextDark,
    },
  }),
  // eslint-disable-next-line @typescript-eslint/camelcase
  google_oauth2: css({
    border: `1px solid #E5ADA3`,
    color: tokens.colorRedDark,
    'input[type="submit"]': {
      color: tokens.colorRedDark,
    },
  }),
  twitter: css({
    border: `1px solid #A8CFF1`,
    color: tokens.colorBlueDark,
    'input[type="submit"]': {
      color: tokens.colorBlueDark,
    },
  }),
  tooltipTargetWrapper: css({ display: 'flex' }),
};

type ProviderHumanNamesMap = { [key in Identity['provider']]: string };
const providerHumanNames: ProviderHumanNamesMap = {
  // eslint-disable-next-line @typescript-eslint/camelcase
  google_oauth2: 'Google',
  github: 'Github',
  twitter: 'Twitter',
};

interface IdentitiesSectionProps {
  identities?: Identity[];
  userHasPassword?: boolean;
  onRemoveIdentity: (identityId: Identity['sys']['id']) => void;
}

export function IdentitiesSection({
  identities = [],
  userHasPassword = false,
  onRemoveIdentity,
}: IdentitiesSectionProps) {
  const availableProviders = Object.keys(providerHumanNames).filter(
    (providerName) => !identities?.find((identity) => providerName === identity.provider)
  );

  return (
    <section data-test-id="identities-section">
      {identities.length > 0 && (
        <Flex flexDirection="column" marginBottom="spacingL">
          <Subheading>Connected open identities:</Subheading>

          <Flex marginTop="spacingS">
            {identities.map((identity) => {
              return (
                <ConnectedIdentity
                  key={identity.provider}
                  provider={identity.provider}
                  identityId={identity.sys.id}
                  disallowRemoval={!userHasPassword && identities.length === 1}
                  onRemove={onRemoveIdentity}
                />
              );
            })}
          </Flex>
        </Flex>
      )}
      {availableProviders.length > 0 && (
        <Flex flexDirection="column">
          <Subheading>Available open identities:</Subheading>

          <Flex marginTop="spacingS">
            {availableProviders.map((provider) => {
              return (
                <AvailableIdentity key={provider} provider={provider as Identity['provider']} />
              );
            })}
          </Flex>
        </Flex>
      )}
    </section>
  );
}

interface ConnectedIdentityProps {
  identityId: Identity['sys']['id'];
  provider: Identity['provider'];
  onRemove: (id: Identity['sys']['id']) => void;
  disallowRemoval?: boolean;
}

function ConnectedIdentity({
  identityId,
  provider,
  onRemove,
  disallowRemoval = false,
}: ConnectedIdentityProps) {
  const [isModalShown, setModalShown] = useState(false);

  const humanName = providerHumanNames[provider];

  const removeIdentity = async (identityId: Identity['sys']['id']) => {
    // identityIds are, weirdly, numbers, so they must be cast to string before making the API call
    try {
      await deleteUserIdentityData(identityId.toString());
    } catch {
      Notification.error(`An error occurred while removing ${humanName} from your profile.`);

      return;
    }

    onRemove(identityId);

    Notification.success(`${humanName} successfully removed from your profile.`);
  };

  return (
    <>
      <div className={cx(styles[provider], styles.identityItem)}>
        {getProviderIcon(provider)}
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
                icon: 'Close',
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
    </>
  );
}

interface AvailableIdentityProps {
  provider: Identity['provider'];
}

function AvailableIdentity({ provider }: AvailableIdentityProps) {
  const humanName = providerHumanNames[provider];

  return (
    <form
      data-test-id={`add-${provider}-identity-form`}
      action={oauthUrl(provider, '/account/user/profile')}
      method="post">
      <div className={cx(styles[provider], styles.identityItem)}>
        {getProviderIcon(provider)}
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

function getProviderIcon(provider: Identity['provider']) {
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
