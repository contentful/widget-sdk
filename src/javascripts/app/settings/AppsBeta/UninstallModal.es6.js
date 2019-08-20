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
  TextInput
} from '@contentful/forma-36-react-components';

const styles = {
  buttonMargin: css({
    marginLeft: tokens.spacingM
  }),
  icon: css({
    verticalAlign: 'middle'
  }),
  separator: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL
  }),
  otherInput: css({
    marginTop: tokens.spacingM
  }),
  checkbox: css({
    label: {
      fontWeight: tokens.fontWeightNormal
    }
  })
};

function createListItem(item) {
  let icon = 'CheckCircle';
  let iconColor = 'positive';

  if (item.negative) {
    icon = 'ErrorCircle';
    iconColor = 'negative';
  }

  return (
    <ListItem key={item.info} testId="action-list-item">
      <Icon icon={icon} color={iconColor} className={styles.icon} /> {item.info}
    </ListItem>
  );
}

const reasons = [
  'Does not do what I expected',
  'Not needed anymore',
  'App is not performing well',
  'I have created my own',
  'I was just testing it out'
];

function parseReasons(checked, otherReason) {
  const formattedOther = otherReason ? `Other: ${otherReason}` : '';
  return Object.keys(checked)
    .filter(x => checked[x])
    .map(reason => reasons[reason])
    .concat(formattedOther || []);
}

export default function UninstallModal({ onConfirm, onClose, actionList, isShown }) {
  const [checked, onCheck] = useState({});
  const [otherChecked, toggleOther] = useState(false);
  const [otherReason, setOtherReason] = useState('');

  return (
    <Modal title="Uninstall app?" onClose={onClose} isShown={isShown}>
      <Typography>
        <Paragraph>This will remove the app and its features.</Paragraph>
      </Typography>
      <List testId="action-list">{actionList.map(createListItem)}</List>
      <hr className={styles.separator} />

      <Typography>
        <Subheading>Reasons for removing (optional)</Subheading>
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
              onChange={e => onCheck({ ...checked, [i]: e.target.checked })}
              id={reason}
              testId={`reason-${i}`}
            />
          </ListItem>
        ))}
        <ListItem>
          <CheckboxField
            className={styles.checkbox}
            key="Other"
            labelText="Other"
            name="someOption"
            checked={otherChecked}
            onChange={() => toggleOther(!otherChecked)}
            id="Other"
            testId={`reason-${reasons.length}`}
          />
        </ListItem>
        {otherChecked && (
          <TextInput
            className={styles.otherInput}
            value={otherReason}
            onChange={e => setOtherReason(e.target.value)}
            name="otherReason"
            id="otherReason"
            testId="reason-custom"
          />
        )}
      </div>
      <hr className={styles.separator} />
      <Button
        testId="uninstall-button"
        onClick={() => onConfirm(parseReasons(checked, otherReason))}
        buttonType="negative">
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
  actionList: PropTypes.arrayOf(
    PropTypes.shape({
      info: PropTypes.string.isRequired,
      positive: PropTypes.bool
    })
  ),
  isShown: PropTypes.bool.isRequired
};
