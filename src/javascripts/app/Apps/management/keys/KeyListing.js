import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as ModalLauncher from 'app/common/ModalLauncher';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import moment from 'moment';

import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paragraph,
  TextLink,
  Button,
  Notification,
  SkeletonContainer,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';

import * as ManagementApiClient from '../ManagementApiClient';
import { getAppDefinitionLoader } from 'app/Apps/AppDefinitionLoaderInstance';
import AddKeyModal from './AddKeyDialog';
import RevokeKeyModal from './RevokeKeyDialog';
import * as util from '../util';
import { MAX_KEYS_ALLOWED } from 'app/Apps/config';

const styles = {
  spacer: css({
    marginBottom: tokens.spacingL,
  }),
  fingerprint: css({
    display: 'block',
    fontFamily: tokens.fontStackMonospace,
    fontSize: tokens.fontsizeS,
  }),
  lightText: css({
    color: tokens.colorTextLight,
  }),
};

const getFormattedKey = async (key) => {
  const fingerprint = key.jwk.x5t;
  const hexFingerprint = util.base64ToHex(fingerprint).replace(/(..)/g, '$1:').replace(/:$/, '');
  const mid = hexFingerprint.length / 2 + 1;
  const fingerprintLines = [hexFingerprint.substr(0, mid), hexFingerprint.substr(mid)];

  return {
    fingerprint,
    fingerprintLines,
    createdAt: moment(key.sys.createdAt).format('MMMM DD, YYYY'),
    lastUsedAt: key.sys.lastUsedAt
      ? 'Last used ' + util.formatPastDate(key.sys.lastUsedAt)
      : 'Never used',
    // TODO: batch getting creators
    createdBy: await ManagementApiClient.getCreatorNameOf(key),
  };
};

const fetchKeys = async (orgId, definitionId) => {
  const keys = await getAppDefinitionLoader(orgId).getKeysForAppDefinition(definitionId);

  return Promise.all(keys.map(getFormattedKey));
};

const openAddKeyModal = (orgId, definitionId, setNewKey) => {
  ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <AddKeyModal
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
      <RevokeKeyModal
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

const TableWrapper = ({ children }) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Public key fingerprint</TableCell>
          <TableCell>Added at</TableCell>
          <TableCell>Added by</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>{children}</TableBody>
    </Table>
  );
};

const SkeletonRow = () => {
  return (
    <TableRow>
      <TableCell>
        <div>
          <SkeletonContainer svgWidth="420" svgHeight="40">
            <SkeletonBodyText />
          </SkeletonContainer>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <SkeletonContainer width="420" svgHeight="40">
            <SkeletonBodyText />
          </SkeletonContainer>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <SkeletonContainer svgHeight="40">
            <SkeletonBodyText numberOfLines={1} />
          </SkeletonContainer>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <SkeletonContainer svgWidth="50" svgHeight="40">
            <SkeletonBodyText numberOfLines={1} />
          </SkeletonContainer>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function KeyListing({ definition }) {
  const definitionId = definition.sys.id;
  const orgId = definition.sys.organization.sys.id;

  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [formattedKeys, setKeys] = useState(null);
  const hasKeys = formattedKeys && !!formattedKeys.length;

  useEffect(() => {
    (async () => {
      setIsLoadingKeys(true);
      setKeys(await fetchKeys(orgId, definitionId));
      setIsLoadingKeys(false);
    })();
  }, [orgId, definitionId]);

  return (
    <>
      <Paragraph className={styles.spacer}>
        Your app needs a key pair to sign access token requests. We do not store private keys.
      </Paragraph>

      <div>
        <Button
          className={styles.spacer}
          disabled={formattedKeys && formattedKeys.length >= MAX_KEYS_ALLOWED}
          onClick={() =>
            openAddKeyModal(orgId, definitionId, (newFormattedKey) =>
              setKeys([...formattedKeys, newFormattedKey])
            )
          }
          testId="app-add-public-key">
          Add public key
        </Button>
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
          <TableRow>
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
