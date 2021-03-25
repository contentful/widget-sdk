import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Paragraph,
  TextField,
  Typography,
  ModalConfirm,
  FieldGroup,
  CheckboxField,
  Notification,
  ListItem,
  List,
  Flex,
} from '@contentful/forma-36-react-components';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { removeAddOnPlanFromSubscription } from 'features/pricing-entities';
import { uninstalled as trackUninstallationReason } from 'features/apps';
import { clearCachedProductCatalogFlags } from 'data/CMA/ProductCatalog';
import { captureError } from 'services/logger';
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

export function CancelAppsSubscriptionModal({ isShown, onClose, organizationId, addOnPlan }) {
  const [textFeedback, setTextFeedback] = useState('');
  const [checkedReasons, setCheckedReasons] = useState({});
  const [loading, setLoading] = useState(false);

  const disableConfirm = !Object.values(checkedReasons).some((reason) => !!reason);

  return (
    <ModalConfirm
      isShown={isShown}
      intent="negative"
      title="Cancel Compose + Launch"
      confirmLabel="Cancel Compose + Launch"
      isConfirmDisabled={disableConfirm || loading}
      isConfirmLoading={loading}
      onConfirm={async () => {
        setLoading(true);
        const parsedReasons = parseReasons(checkedReasons, textFeedback);
        try {
          await handleConfirm(organizationId, addOnPlan.sys.id, parsedReasons);
        } catch {
          Notification.error(
            "Couldn't cancel your Compose + Launch subscription. Contact support."
          );
          setLoading(false);
          return;
        }
        Notification.success(
          'Compose + Launch app was successfully removed from your subscription.'
        );
        setLoading(false);
        onClose();
      }}
      onCancel={() => onClose()}>
      <Flex marginBottom="spacingM">
        <Typography>
          <Paragraph>
            You’re about to cancel your Compose + Launch subscription for your whole organization.
            You will not be able to access the apps, but none of your content will be deleted.
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
    </ModalConfirm>
  );
}

CancelAppsSubscriptionModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  organizationId: PropTypes.string.isRequired,
  addOnPlan: PropTypes.object.isRequired,
};
