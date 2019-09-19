import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  TextField,
  Form,
  CheckboxField
} from '@contentful/forma-36-react-components';
import { updateUserData, userAccountDataShape } from './AccountService.es6';
// {
//   "firstName": "Free",
//   "lastName": "Bloggs",
//   "email": "fred@example.com",
//   "password": "jfhf6373",
//   "currentPassword": "password",
//   "logAnalyticsFeature": false
// }

function AccountEditorModal({ userState, setUserState, showModal, setShowModal }) {
  const [password, setNewPasswordState] = useState('');
  const [currentPassword, setCurrentPasswordState] = useState('');

  const submitForm = ({ password, currentPassword, userState }) => {
    updateUserData({
      version: userState.sys.version,
      data: {
        firstName: userState.firstName,
        lastName: userState.lastName,
        email: userState.email,
        password,
        currentPassword
      }
    });
    setShowModal(false);
  };

  return (
    <Modal
      title="Edit account details"
      shouldCloseOnEscapePress={true}
      shouldCloseOnOverlayClick={true}
      isShown={showModal}
      onClose={() => setShowModal(false)}>
      <Form>
        <TextField
          required
          // validationMessage={'validation message'}
          id="first-name-field"
          name="first-name"
          value={userState.firstName}
          onChange={({ target: { value } }) => setUserState({ ...userState, firstName: value })}
          labelText="First Name"
          textInputProps={{ type: 'text', autoComplete: 'off' }}
        />
        <TextField
          required
          id="last-name-field"
          name="last-name"
          value={userState.lastName}
          onChange={({ target: { value } }) => setUserState({ ...userState, lastName: value })}
          labelText="Last Name"
          textInputProps={{ type: 'text', autoComplete: 'off' }}
        />
        <TextField
          required
          id="email-field"
          name="email"
          value={userState.email}
          onChange={({ target: { value } }) => setUserState({ ...userState, email: value })}
          labelText="Email"
          textInputProps={{ type: 'email', autoComplete: 'off' }}
        />
        <TextField
          id="new-password-field"
          name="new-password"
          value={password}
          onChange={({ target: { value } }) => setNewPasswordState(value)}
          labelText="New Password"
          textInputProps={{ type: 'password', autoComplete: 'off' }}
        />
        <TextField
          id="current-password-field"
          name="current-password"
          value={currentPassword}
          onChange={({ target: { value } }) => setCurrentPasswordState(value)}
          labelText="Current Password"
          textInputProps={{ type: 'password', autoComplete: 'off' }}
        />
        <CheckboxField
          labelText="I agree"
          value={userState.logAnalyticsFeature ? 'yes' : 'no'}
          helpText="Click if you agree to log analytics"
          onChange={() =>
            setUserState({ ...userState, logAnalyticsFeature: !userState.logAnalyticsFeature })
          }
          checked={userState.logAnalyticsFeature === true}
          id="termsCheckboxYes"
        />
        <Button
          onClick={() => submitForm({ password, currentPassword, userState })}
          type="submit"
          buttonType="positive">
          Confirm
        </Button>
        <Button onClick={() => setShowModal(false)} buttonType="muted">
          Close
        </Button>
      </Form>
    </Modal>
  );
}

AccountEditorModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  userState: userAccountDataShape.isRequired,
  initialUserData: userAccountDataShape.isRequired,
  setUserState: PropTypes.func.isRequired
};

export default AccountEditorModal;
