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
import { removeAddOnPlan } from 'features/pricing-entities';
import { uninstalled as trackUninstallationReason } from 'features/apps';
import { logError } from 'services/logger';

const styles = {
  listItem: css({
    listStyleType: 'none',
  }),
};

async function requestRemoveAddOn(organizationId, addOnId, parsedReasons) {
  try {
    const endpoint = createOrganizationEndpoint(organizationId);
    await removeAddOnPlan(endpoint, addOnId);
    Notification.success('Compose + Launch app was uninstalled successfully.');
    trackUninstallationReason('Compose + Launch', parsedReasons);
    document.location.reload();
  } catch (e) {
    Notification.error("Couldn't uninstall Compose + Launch. Contact support.");
    logError(`Failed to uninstall Compose + Launch`, {
      error: e,
    });
  }
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

export function DeleteAppsModal({ isShown, onClose, organizationId, addOn }) {
  const [textFeedback, setTextFeedback] = useState('');
  const [checkedReasons, setCheckedReasons] = useState({});
  const [loading, setLoading] = useState(false);

  const disableConfirm = !Object.values(checkedReasons).some((reason) => !!reason);

  const onConfirm = async () => {
    setLoading(true);
    const parsedReasons = parseReasons(checkedReasons, textFeedback);
    await requestRemoveAddOn(organizationId, addOn.sys.id, parsedReasons);
    setLoading(false);
    onClose();
  };

  return (
    <ModalConfirm
      isShown={isShown}
      intent="negative"
      title="Remove apps from organization"
      confirmLabel="Remove apps from organization"
      isConfirmDisabled={disableConfirm || loading}
      isConfirmLoading={loading}
      onConfirm={onConfirm}
      onCancel={() => onClose()}>
      <Flex marginBottom="spacingM">
        <Typography>
          <Paragraph>You are about to remove Compose + Launch from your organization</Paragraph>
          <Paragraph>
            Removing apps will remove Compose + Launch from all spaces in your organization. You
            will lose access to the platforms, none of your content will be lost.
          </Paragraph>
          <Paragraph>
            <strong>Why are you removing the apps?</strong>
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
  isShown: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  organizationId: PropTypes.string,
  addOn: PropTypes.object,
};
