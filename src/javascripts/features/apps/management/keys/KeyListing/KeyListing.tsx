import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import {
  Button,
  Note,
  Notification,
  Paragraph,
  TableCell,
  TableRow,
  TextLink,
} from '@contentful/forma-36-react-components';

import { ManagementApiClient } from 'features/apps';
import { AddKeyDialog } from '../AddKeyDialog';
import { RevokeKeyDialog } from '../RevokeKeyDialog';
import { MAX_KEYS_ALLOWED } from 'features/apps/config';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { KEY_GEN_GUIDE_URL } from '../../constants';
import { downloadAsFile, fetchKeys, getFormattedKey, Key } from './utils';
import { WithLimitTooltip } from './WithLimitsTooltip';
import { SkeletonRow } from './SkeletonRow';
import { TableWrapper } from './TableWrapper';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'new-app',
  campaign: 'in-app-help',
});

const styles = {
  spacer: css({
    marginBottom: tokens.spacingL,
  }),
  fingerprint: css({
    display: 'block',
    fontFamily: tokens.fontStackMonospace,
    fontSize: tokens.fontSizeS,
  }),
  lightText: css({
    color: tokens.colorTextLight,
  }),
  emptyStateRow: css({
    '&:hover': {
      background: 'transparent',
    },
  }),
  ctasWrapper: css({
    display: 'flex',
    marginBottom: tokens.spacingL,
  }),
  ctaTextWrapper: css({
    height: '2.5rem',
    lineHeight: '2.5rem',
  }),
};

const openAddKeyModal = (orgId, definitionId, setNewKey) => {
  ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <AddKeyDialog
        isShown={isShown}
        onCancel={onClose}
        onConfirm={async (jwk) => {
          try {
            const key = await ManagementApiClient.addKey({ orgId, definitionId, jwk });
            const formattedKey = await getFormattedKey(key);

            setNewKey(formattedKey);
            onClose();
          } catch {
            Notification.error(
              'Failed to create the public key. Please make sure that your public key is valid.'
            );
          }
        }}
      />
    );
  });
};

const openRevokeKeyModal = (orgId, definitionId, fingerprint, onConfirm) => {
  ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <RevokeKeyDialog
        isShown={isShown}
        onCancel={onClose}
        onConfirm={async () => {
          try {
            await ManagementApiClient.revokeKey({ orgId, definitionId, fingerprint });
            onConfirm();
            onClose();
          } catch {
            Notification.error('Failed to revoke the public key.');
          }
        }}
      />
    );
  });
};

const CTATextWrapper = ({ children }) => <span className={styles.ctaTextWrapper}>{children}</span>;

export function KeyListing({ definition }) {
  const definitionId = definition.sys.id;
  const orgId = definition.sys.organization.sys.id;

  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [formattedKeys, setKeys] = useState<Key[]>([]);
  const hasKeys = !!formattedKeys.length;
  const hasReachedKeysLimits = formattedKeys.length >= MAX_KEYS_ALLOWED;

  useEffect(() => {
    (async () => {
      setIsLoadingKeys(true);
      setKeys(await fetchKeys(orgId, definitionId));
      setIsLoadingKeys(false);
    })();
  }, [orgId, definitionId]);

  return (
    <>
      <Note className={styles.spacer}>
        You need a private key to sign access token requests. We only store public keys.
        <br />
        <TextLink
          href={withInAppHelpUtmParams(KEY_GEN_GUIDE_URL)}
          target="_blank"
          rel="noopener noreferrer">
          Learn how to sign your access tokens
        </TextLink>
      </Note>

      <div className={styles.ctasWrapper}>
        <WithLimitTooltip enabled={hasReachedKeysLimits}>
          <Button
            loading={isGeneratingKeys}
            disabled={isGeneratingKeys || hasReachedKeysLimits}
            onClick={async () => {
              setIsGeneratingKeys(true);
              try {
                const response = await ManagementApiClient.generateKey({
                  orgId,
                  definitionId,
                });
                downloadAsFile('application/x-pem-file', response.generated.privateKey, 'key.pem');
                setKeys([...formattedKeys, await getFormattedKey(response)]);
              } catch (e) {
                Notification.error('Unable to generate App Keys. Please try uploading your own.');
              }
              setIsGeneratingKeys(false);
            }}
            testId="app-generate-keys">
            Generate key pair
          </Button>
        </WithLimitTooltip>
        <CTATextWrapper>&nbsp;or&nbsp;</CTATextWrapper>
        <WithLimitTooltip enabled={hasReachedKeysLimits}>
          <CTATextWrapper>
            <TextLink
              linkType="secondary"
              className={styles.spacer}
              disabled={hasReachedKeysLimits}
              onClick={() =>
                openAddKeyModal(orgId, definitionId, (newFormattedKey) =>
                  setKeys([...formattedKeys, newFormattedKey])
                )
              }
              testId="app-add-public-key">
              upload a public key
            </TextLink>
          </CTATextWrapper>
        </WithLimitTooltip>
      </div>

      {isLoadingKeys ? (
        <TableWrapper>
          <SkeletonRow />
          <SkeletonRow />
        </TableWrapper>
      ) : hasKeys ? (
        <TableWrapper>
          {formattedKeys.map((key) => {
            return (
              <TableRow key={key.fingerprint}>
                <TableCell>
                  <div>
                    <span className={styles.fingerprint}>{key.fingerprintLines[0]}</span>
                    <span className={styles.fingerprint}>{key.fingerprintLines[1]}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{key.createdAt}</div>
                    <div className={styles.lightText}>{key.lastUsedAt}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>{key.createdBy}</div>
                </TableCell>
                <TableCell align="right">
                  <TextLink
                    onClick={() =>
                      openRevokeKeyModal(orgId, definitionId, key.fingerprint, () =>
                        setKeys(formattedKeys.filter((k) => k.fingerprint !== key.fingerprint))
                      )
                    }
                    linkType="negative">
                    Revoke
                  </TextLink>
                </TableCell>
              </TableRow>
            );
          })}
        </TableWrapper>
      ) : (
        <TableWrapper>
          <TableRow className={styles.emptyStateRow}>
            <TableCell>
              <Paragraph>Your app currently has no key pairs associated with it.</Paragraph>
            </TableCell>
          </TableRow>
        </TableWrapper>
      )}
    </>
  );
}

KeyListing.propTypes = {
  definition: PropTypes.object.isRequired,
};
