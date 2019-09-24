import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Button,
  Modal,
  Typography,
  Paragraph,
  FieldGroup,
  RadioButtonField,
  Textarea,
  Note,
  FormLabel
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { deleteUserAccount } from './AccountService.es6';
import ContactUsButton from 'ui/Components/ContactUsButton.es6';

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

const DeleteUser = ({ singleOwnerOrganizations }) => {
  const reasons = {
    otherSolution: { name: "I've found another solution", key: 'other_solution' },
    notUseful: { name: "I don't find it useful", key: 'not_useful' },
    dontUnderstand: { name: "I don't understand how to use it", key: 'dont_understand' },
    temporary: { name: "It's temporary. I'll be back", key: 'temporary' },
    other: { name: 'Other', key: 'other' }
  };
  const [showModal, setShowModal] = useState(false);
  const [activeOption, setActiveOption] = useState(reasons.other.key);
  const [details, setDetails] = useState('');

  const onCancelUser = ({ activeOption, details }) => {
    deleteUserAccount({ reason: activeOption, description: details });
  };

  const warningNoteCountCopy =
    singleOwnerOrganizations.length === 1
      ? `your organization ${singleOwnerOrganizations[0].name}`
      : `all ${singleOwnerOrganizations.length} of your organizations`;

  return (
    <>
      <Typography className={styles.paddingS}>
        <Heading>Danger Zone</Heading>
        <Button buttonType="negative" onClick={() => setShowModal(true)}>
          Delete my account
        </Button>
      </Typography>

      <Modal
        title="Delete my account"
        intent="negative"
        shouldCloseOnEscapePress={true}
        shouldCloseOnOverlayClick={true}
        isShown={showModal}
        size="large"
        testId="dialog-user-cancellation"
        confirmTestId="confirm-user-cancellation"
        cancelTestId="cancel-user-cancellation">
        <Typography>
          {singleOwnerOrganizations.length && (
            <Note className={styles.warningNote} noteType="negative">
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
          <FormLabel>Why are you deleting your account?</FormLabel>
          <FieldGroup>
            {Object.keys(reasons).map((reason, index) => (
              <RadioButtonField
                key={index}
                id={reasons[reason].key}
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
          <FormLabel>Additional details</FormLabel>
          <Textarea
            name="cancellationDetails"
            value={details}
            onChange={e => setDetails(e.target.value)}></Textarea>
        </Typography>
        <div className={styles.buttons}>
          <Button
            buttonType="negative"
            onClick={() => {
              setShowModal(false);
              onCancelUser({ activeOption, details });
            }}>
            Delete my account
          </Button>
          <Button
            buttonType="muted"
            onClick={() => {
              setShowModal(false);
            }}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
};

DeleteUser.propTypes = {
  singleOwnerOrganizations: PropTypes.array.isRequired
};

export default DeleteUser;
