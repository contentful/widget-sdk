import React, { useState, useCallback } from 'react';
import {
  Button,
  Modal,
  TextInput,
  Flex,
  Paragraph,
  Typography,
  TextLink,
  Notification,
  ModalLauncher,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import APIClient from 'data/APIClient';
import { SpaceProps } from 'contentful-management/types';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { getSpace } from 'access_control/OrganizationMembershipRepository';
import { useAsync } from 'core/hooks';
import { ReactRouterLink } from 'core/react-routing';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import * as TokenStore from 'services/TokenStore';
import { track } from 'analytics/Analytics';

const NEW_SPACE_NAME = 'New space';

const styles = {
  header: css({
    backgroundColor: tokens.colorElementLightest,
  }),
};
interface Props {
  isShown: boolean;
  onConfirm: (spaceId) => void;
  onClose: () => void;
  spaceId: string;
}

export const showReplaceSpaceWarning = async (spaceId, onConfirm) => {
  await ModalLauncher.open(({ onClose }) => (
    <ReplaceSpaceDialog isShown onConfirm={onConfirm} onClose={onClose} spaceId={spaceId} />
  ));
};

export const ReplaceSpaceDialog = ({ isShown, onConfirm, onClose, spaceId }: Props) => {
  const [spaceNameConfirmation, setSpaceNameConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [space, setSpace] = useState<SpaceProps>();

  useAsync(
    useCallback(async () => {
      const spaceEndpoint = createSpaceEndpoint(spaceId);
      const space = await getSpace(spaceEndpoint);
      setSpace(space);
    }, [spaceId, setSpace])
  );

  const handleReplace = async () => {
    setDeleting(true);
    if (space) {
      const oldSpaceName = space.name;
      const organizationId = space.sys.organization.sys.id;
      const endpoint = createSpaceEndpoint(space.sys.id);
      const client = new APIClient(endpoint);
      try {
        await client.deleteSpace();
      } catch {
        Notification.error(`Failed to delete ${space.name}. Try again.`);
        setDeleting(false);
        return;
      }
      const cmaClient = getCMAClient();
      const newSpace = await cmaClient.space.create(
        {
          organizationId,
        },
        {
          name: NEW_SPACE_NAME,
        }
      );
      await TokenStore.refresh();

      track(`onboarding_replace:replace`);
      try {
        await onConfirm(newSpace.sys.id);
      } finally {
        Notification.success(`Space ${oldSpaceName} replaced successfully.`);
        setDeleting(false);
        onClose();
      }
    }
  };

  return (
    <Modal
      testId="replace-space-dialog"
      isShown={isShown}
      onClose={onClose}
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}>
      {() => {
        if (space) {
          return (
            <>
              <Modal.Header title="Replace space" className={styles.header} />
              <Modal.Content testId="replace-space-modal">
                <Typography>
                  <Paragraph>Are you sure you want to replace the space? </Paragraph>
                  <Paragraph>
                    You are about to replace the space <strong>{space.name}</strong> as free space
                    is limited to one per organization. You can also{' '}
                    <ReactRouterLink
                      route={{
                        path: 'organizations.subscription.new_space',
                        orgId: space.sys.organization.sys.id,
                      }}>
                      <TextLink onClick={onClose}>buy more spaces</TextLink>
                    </ReactRouterLink>{' '}
                    instead.
                  </Paragraph>
                  <Paragraph>
                    All space contents will be removed. This operation cannot be undone.
                  </Paragraph>
                  <Paragraph>
                    To confirm, type the name of the space you’re about to replace in the field
                    below:
                  </Paragraph>
                  <TextInput
                    value={spaceNameConfirmation}
                    onChange={({ target: { value } }) => setSpaceNameConfirmation(value)}
                    testId="space-name-confirmation-field"
                  />
                  <Flex paddingTop="spacingM">
                    <Flex paddingRight="spacingS">
                      <Button
                        buttonType="negative"
                        loading={deleting}
                        disabled={spaceNameConfirmation !== space.name || deleting}
                        onClick={handleReplace}
                        testId="replace-btn">
                        Replace
                      </Button>
                    </Flex>
                    <Button
                      buttonType="muted"
                      onClick={() => {
                        track(`onboarding_replace:cancel`);
                        onClose();
                      }}
                      testId="cancel-btn">
                      Cancel
                    </Button>
                  </Flex>
                </Typography>
              </Modal.Content>
            </>
          );
        }
      }}
    </Modal>
  );
};
