import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Modal,
  Typography,
  Paragraph,
  FieldGroup,
  RadioButtonField,
  Textarea,
  Note,
  FormLabel,
  Notification
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { deleteUserAccount } from './AccountRepository';

const styles = {
  warningNote: css({ marginBottom: tokens.spacingL }),
  orgName: css({
    fontWeight: tokens.fontWeightDemiBold,
    fontSize: tokens.fontSizeM,
    color: tokens.colorTextDark
  }),
  paddingS: css({ padding: tokens.spacingS }),
  buttons: css({
    marginTop: tokens.spacingM,
    '> button': {
      marginRight: tokens.spacingM
    }
  })
};

const DeleteUserModal = ({ singleOwnerOrganizations, onConfirm, onCancel, isShown }) => {
  const reasons = {
    otherSolution: { name: "I've found another solution", key: 'other_solution' },
    notUseful: { name: "I don't find it useful", key: 'not_useful' },
    dontUnderstand: { name: "I don't understand how to use it", key: 'dont_understand' },
    temporary: { name: "It's temporary. I'll be back", key: 'temporary' },
    other: { name: 'Other', key: 'other' }
  };

  const [activeOption, setActiveOption] = useState(reasons.other.key);
  const [details, setDetails] = useState('');
  const [deleting, setDeleting] = useState(false);

  const deleteUser = async ({ activeOption, details }) => {
    setDeleting(true);

    try {
      await deleteUserAccount({ reason: activeOption, description: details });
    } catch {
      setDeleting(false);

      Notification.error('Something went wrong while deleting your account. Try again.');

      return;
    }

    onConfirm();
  };

  const warningNoteCountCopy =
    singleOwnerOrganizations.length === 1
      ? `your organization ${singleOwnerOrganizations[0].name}`
      : `all ${singleOwnerOrganizations.length} of your organizations`;

  return (
    <Modal
      title="Delete my account"
      intent="negative"
      shouldCloseOnEscapePress={true}
      shouldCloseOnOverlayClick={true}
      isShown={isShown}
      onClose={() => {
        setActiveOption(reasons.other.key);
        setDetails('');
        onCancel();
      }}
      size="large"
      testId="dialog-user-cancellation"
      confirmTestId="confirm-user-cancellation"
      cancelTestId="cancel-user-cancellation">
      <Typography>
        {singleOwnerOrganizations.length && (
          <Note
            testId="single-owner-orgs-warning"
            className={styles.warningNote}
            noteType="negative">
            <strong>
              We will delete {warningNoteCountCopy}, including all spaces and all content, as soon
              as you delete your account.
            </strong>
          </Note>
        )}
        <Paragraph>
          If there is anything we can help you with, please{' '}
          <ContactUsButton noIcon>get in touch with us</ContactUsButton>.
        </Paragraph>
        <FormLabel htmlFor="reasons">Why are you deleting your account?</FormLabel>
        <FieldGroup id="reasons">
          {Object.keys(reasons).map((reason, index) => (
            <RadioButtonField
              key={index}
              id={reasons[reason].key}
              testId={`reason-${reasons[reason].key}`}
              labelText={reasons[reason].name}
              name={reasons[reason].key}
              checked={activeOption === reasons[reason].key}
              value={reasons[reason].key}
              onChange={e => {
                setActiveOption(e.target.value);
              }}
            />
          ))}
        </FieldGroup>
        <FormLabel htmlFor="cancellationDetails">Additional details</FormLabel>
        <Textarea
          name="cancellationDetails"
          id="cancellationDetails"
          testId="cancellation-details"
          value={details}
          onChange={e => setDetails(e.target.value)}></Textarea>
      </Typography>
      <div className={styles.buttons}>
        <Button
          testId="confirm-delete-account-button"
          buttonType="negative"
          disabled={deleting}
          loading={deleting}
          onClick={() => {
            deleteUser({ activeOption, details });
          }}>
          Delete my account
        </Button>
        <Button
          buttonType="muted"
          testId="cancel"
          onClick={() => {
            setActiveOption(reasons.other.key);
            setDetails('');
            onCancel();
          }}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

DeleteUserModal.propTypes = {
  singleOwnerOrganizations: PropTypes.array.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired
};

export default DeleteUserModal;
