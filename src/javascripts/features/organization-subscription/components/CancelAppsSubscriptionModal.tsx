import React, { useState } from 'react';
import { css } from 'emotion';
import {
  Paragraph,
  TextField,
  Typography,
  FieldGroup,
  CheckboxField,
  Notification,
  ListItem,
  List,
  Flex,
  Button,
  Modal,
} from '@contentful/forma-36-react-components';

import { captureError } from 'core/monitoring';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { clearCachedProductCatalogFlags } from 'data/CMA/ProductCatalog';
import { removeAddOnPlanFromSubscription, AddOnPlan } from 'features/pricing-entities';
import { uninstalled as trackUninstallationReason } from 'features/apps';
import { reload } from 'states/Navigator';

const styles = {
  listItem: css({
    listStyleType: 'none',
  }),
};

async function handleConfirm(organizationId, addOnPlanId, parsedReasons) {
  const endpoint = createOrganizationEndpoint(organizationId);

  try {
    await removeAddOnPlanFromSubscription(endpoint, addOnPlanId);
  } catch (e) {
    captureError(e);
    throw e;
  }

  trackUninstallationReason('Compose + Launch', parsedReasons);
  clearCachedProductCatalogFlags();
  reload();
}

const reasons = [
  'Does not do what I expected',
  'Not needed anymore',
  'Apps are not performing well',
  'I have created my own solution',
  'I was just testing it out',
];

function parseReasons(checkedReasons, customReason) {
  return Object.keys(checkedReasons)
    .filter((reasonId) => checkedReasons[reasonId])
    .map((reason) => reasons[reason])
    .concat(customReason ? [{ custom: customReason }] : []);
}

interface CancelAppsSubscriptionModalProps {
  isShown: boolean;
  onClose: () => void;
  organizationId: string;
  addOnPlan: AddOnPlan;
}

export function CancelAppsSubscriptionModal({
  isShown,
  onClose,
  organizationId,
  addOnPlan,
}: CancelAppsSubscriptionModalProps) {
  const [textFeedback, setTextFeedback] = useState('');
  const [checkedReasons, setCheckedReasons] = useState({});
  const [loading, setLoading] = useState(false);

  const disableConfirm = !Object.values(checkedReasons).some((reason) => !!reason);

  const handleOnConfirm = async () => {
    setLoading(true);
    const parsedReasons = parseReasons(checkedReasons, textFeedback);
    try {
      await handleConfirm(organizationId, addOnPlan.sys.id, parsedReasons);
    } catch {
      Notification.error("Couldn't cancel your Compose + Launch subscription. Contact support.");
      setLoading(false);
      return;
    }
    Notification.success('Compose + Launch app was successfully removed from your subscription.');
    setLoading(false);
    onClose();
  };

  return (
    <Modal size="large" isShown={isShown} title="Cancel Compose + Launch" onClose={() => onClose()}>
      {({ title, onClose }) => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Flex marginBottom="spacingM">
              <Typography>
                <Paragraph>
                  You’re about to cancel your Compose + Launch subscription for your whole
                  organization. You will not be able to access the apps, but none of your content
                  will be deleted.
                </Paragraph>
                <Paragraph>
                  If you’re just trying to uninstall the apps from a space, you can do this from the
                  “Apps” tab.
                </Paragraph>
                <Paragraph>
                  <strong>Why are you canceling your subscription?</strong>
                </Paragraph>
                <FieldGroup>
                  <List>
                    {reasons.map((reason, i) => (
                      <ListItem key={reason} className={styles.listItem}>
                        <CheckboxField
                          labelText={reason}
                          checked={checkedReasons[i]}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setCheckedReasons((prevState) => {
                              return { ...prevState, [i]: val };
                            });
                          }}
                          id={`reason-${i}`}
                          name={`reason-${i}`}
                          testId={`reason-${i}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </FieldGroup>
              </Typography>
            </Flex>

            <TextField
              id="feedback"
              name="feedback"
              labelText="What can we improve about the apps?"
              value={textFeedback}
              onChange={(e) => setTextFeedback(e.target.value)}
              textarea
            />
          </Modal.Content>

          <Modal.Controls>
            <Button
              testId="cancel-apps-confirm-button"
              buttonType="negative"
              disabled={disableConfirm || loading}
              loading={loading}
              onClick={handleOnConfirm}>
              Cancel Compose + Launch
            </Button>
            <Button testId="cancel-button" buttonType="muted" onClick={onClose}>
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}
