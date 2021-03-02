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
import { logError } from 'services/logger';
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
    logError(e);
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

export function DeleteAppsModal({ isShown, onClose, organizationId, addOnPlan }) {
  const [textFeedback, setTextFeedback] = useState('');
  const [checkedReasons, setCheckedReasons] = useState({});
  const [loading, setLoading] = useState(false);

  const disableConfirm = !Object.values(checkedReasons).some((reason) => !!reason);

  return (
    <ModalConfirm
      isShown={isShown}
      intent="negative"
      title="Cancel your Compose + Launch subscription"
      confirmLabel="Cancel your subscription"
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
          <Paragraph>You are about to cancel your Compose + Launch subscription.</Paragraph>
          <Paragraph>
            This will remove Compose + Launch from all spaces in your organization. You will lose
            access to the apps, none of your content will be lost.
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

DeleteAppsModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  organizationId: PropTypes.string.isRequired,
  addOnPlan: PropTypes.object.isRequired,
};
