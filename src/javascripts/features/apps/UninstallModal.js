import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Modal,
  Subheading,
  Typography,
  List,
  ListItem,
  Button,
  Icon,
  Paragraph,
  CheckboxField,
  Textarea,
  FormLabel,
} from '@contentful/forma-36-react-components';

const styles = {
  buttonMargin: css({
    marginLeft: tokens.spacingM,
  }),
  icon: css({
    verticalAlign: 'middle',
    fill: tokens.colorTextLightest,
  }),
  separator: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
  }),
  customReasonLabel: css({
    marginTop: tokens.spacingM,
  }),
  checkbox: css({
    label: {
      fontWeight: tokens.fontWeightNormal,
    },
  }),
  actionItem: css({
    display: 'flex',
    flexDirection: 'row',
    marginBottom: tokens.spacingS,
    '& div:first-child': {
      marginRight: tokens.spacingXs,
    },
  }),
};

function createListItem(item) {
  // it is possible to have an undefined item from the API
  if (!item) {
    return null;
  }

  let icon = 'Warning';

  if (item.negative) {
    icon = 'InfoCircle';
  }

  return (
    <ListItem key={item.info} testId="action-list-item" className={styles.actionItem}>
      <div>
        <Icon icon={icon} color="muted" className={styles.icon} />
      </div>
      <div>{item.info}</div>
    </ListItem>
  );
}

const reasons = [
  'Does not do what I expected',
  'Not needed anymore',
  'App is not performing well',
  'I have created my own instead',
  'I was just testing it out',
];

function parseReasons(checked, customReason) {
  return Object.keys(checked)
    .filter((x) => checked[x])
    .map((reason) => reasons[reason])
    .concat(customReason ? [{ custom: customReason }] : []);
}

export function UninstallModal({ onConfirm, onClose, actionList, isShown, askForReasons = true }) {
  const [checked, onCheck] = useState({});
  const [customReason, setCustomReason] = useState('');
  const [isUninstalling, setUninstalling] = useState(false);

  return (
    <Modal title="Uninstall app?" onClose={onClose} isShown={isShown} allowHeightOverflow>
      <Typography>
        <Paragraph>This will remove the app and its features</Paragraph>
      </Typography>
      <List testId="action-list">{actionList.map(createListItem)}</List>

      {askForReasons && (
        <>
          <hr className={styles.separator} />
          <Typography>
            <Subheading>Reason for uninstalling (optional):</Subheading>
          </Typography>
          <div data-test-id="reasons-list">
            {reasons.map((reason, i) => (
              <ListItem key={reason}>
                <CheckboxField
                  className={styles.checkbox}
                  key={reason}
                  labelText={reason}
                  name="someOption"
                  checked={checked[i]}
                  onChange={(e) => onCheck({ ...checked, [i]: e.target.checked })}
                  id={reason}
                  testId={`reason-${i}`}
                />
              </ListItem>
            ))}

            <FormLabel htmlFor="customReason" className={styles.customReasonLabel}>
              What can we improve about the app?
            </FormLabel>
            <Textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
              maxLength={2000}
              name="customReason"
              id="customReason"
              testId="reason-custom"
            />
          </div>
          <hr className={styles.separator} />
        </>
      )}

      <Button
        testId="uninstall-button"
        onClick={() => {
          setUninstalling(true);
          onConfirm(parseReasons(checked, customReason));
        }}
        buttonType="negative"
        loading={isUninstalling}
        disabled={isUninstalling}>
        Uninstall
      </Button>
      <Button
        testId="cancel-button"
        onClick={onClose}
        buttonType="muted"
        className={styles.buttonMargin}>
        Cancel
      </Button>
    </Modal>
  );
}

UninstallModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  askForReasons: PropTypes.bool,
  actionList: PropTypes.arrayOf(
    PropTypes.shape({
      info: PropTypes.string.isRequired,
      positive: PropTypes.bool,
    })
  ),
  isShown: PropTypes.bool.isRequired,
};
