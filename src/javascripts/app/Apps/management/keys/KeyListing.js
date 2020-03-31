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
} from '@contentful/forma-36-react-components';

import * as ManagementApiClient from '../ManagementApiClient';
import AddKeyModal from './AddKeyDialog';
import RevokeKeyModal from './RevokeKeyDialog';
import * as util from '../util';
import { MAX_KEYS_ALLOWED } from 'app/Apps/config';

const styles = {
  spacer: css({
    marginBottom: tokens.spacingL,
  }),
  fingerprint: css({
    fontFamily: tokens.fontStackMonospace,
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
    createdAt: moment(key.sys.createdAt).format('HH:mm:ss'),
    lastUsedAt: key.sys.lastUsedAt
      ? 'Last used ' +
        moment().calendar(null, {
          sameDay: '[today]',
          lastDay: '[yesterday]',
          lastWeek: '[last week]',
          sameWeek: 'dddd',
          sameElse: 'DD/MM/YYYY',
        })
      : 'Never used',
    createdBy: await ManagementApiClient.getCreatorNameOf(key),
  };
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
          } catch {
            Notification.error('Failed to create the public key. Please make sure that your public key is valid.');
          }

          onClose();
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
          } catch {
            Notification.error('Failed to revoke the public key.');
          }

          onClose();
        }}
      />
    );
  });
};

export default function KeyListing({ definition, keys }) {
  const definitionId = definition.sys.id;
  const orgId = definition.sys.organization.sys.id;

  const [formattedKeys, setKeys] = useState([]);

  useEffect(() => {
    Promise.all((keys || []).map(getFormattedKey)).then(setKeys);
  }, [keys]);

  const hasKeys = !!formattedKeys.length;

  return (
    <>
      <Paragraph className={styles.spacer}>
        You need a key pair to sign access token requests. We do not store private keys.{' '}
      </Paragraph>

      {hasKeys && (
        <Table className={styles.spacer}>
          <TableHead>
            <TableRow>
              <TableCell>Public key fingerprint</TableCell>
              <TableCell>Added at</TableCell>
              <TableCell>Added By</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formattedKeys.map((key) => {
              return (
                <TableRow key={key.fingerprint}>
                  <TableCell>
                    <div>
                      <span className={styles.fingerprint}>{key.fingerprintLines[0]} </span>
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
                      Remove
                    </TextLink>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <div>
        <Button
          disabled={formattedKeys.length >= MAX_KEYS_ALLOWED}
          onClick={() =>
            openAddKeyModal(orgId, definitionId, (newFormattedKey) =>
              setKeys([...formattedKeys, newFormattedKey])
            )
          }
          testId="app-add-public-key">
          Add public key
        </Button>
      </div>
    </>
  );
}

KeyListing.propTypes = {
  keys: PropTypes.arrayOf(PropTypes.object).isRequired,
  definition: PropTypes.object.isRequired,
};
