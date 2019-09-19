import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  TextField,
  Form,
  CheckboxField,
  Subheading
} from '@contentful/forma-36-react-components';
import { isEmpty } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import { updateUserData, userAccountDataShape } from './AccountService.es6';
import { css } from 'emotion';

const styles = {
  controlsPanel: css({ display: 'flex' }),
  marginLeftM: css({ marginLeft: tokens.spacingM })
};

function AccountEditorModal({
  userState,
  setUserState: setParentUserState,
  showModal,
  setShowModal
}) {
  const [passwordState, setPasswordState] = useState({
    newPassword: '',
    confirmPassword: '',
    currentPassword: ''
  });
  const [validationState, setValidationState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
    currentPassword: ''
  });
  const [currentPasswordIsRequired, setCurrentPasswordIsRequired] = useState(false);
  const [editorUserState, setEditorUserState] = useState(userState);

  const updateValidationMessages = (errors, validationState) => {
    let newValidationState = validationState;
    errors.forEach(error => {
      switch (error.path) {
        case 'password':
          if (error.name === 'insecure') {
            newValidationState = {
              ...newValidationState,
              newPassword: 'The password you entered is not secure.'
            };
          }
          break;
        case 'current_password':
          if (error.name === 'invalid') {
            newValidationState = {
              ...newValidationState,
              currentPassword: 'The password you entered is not valid.'
            };
          }
          break;
        case 'email':
          if (error.name === 'invalid') {
            newValidationState = {
              ...newValidationState,
              currentPassword: 'The email you entered is not valid.'
            };
          }
          break;
      }
    });
    setValidationState(newValidationState);
  };
  const submitForm = async ({ passwordState, editorUserState }) => {
    const updatedUserData = await updateUserData({
      version: editorUserState.sys.version,
      data: {
        firstName: editorUserState.firstName,
        lastName: editorUserState.lastName,
        email: editorUserState.email,
        password: passwordState.newPassword,
        currentPassword: passwordState.currentPassword
      }
    });
    if (updatedUserData.sys.type === 'User') {
      setParentUserState(editorUserState);
      setShowModal(false);
    } else if (updatedUserData.sys.type === 'Error') {
      updateValidationMessages(updatedUserData.details.errors, validationState);
    }
  };

  const validateName = value => (value.length === 0 ? 'Can not be empty' : '');

  const validateEmail = value => (value.length === 0 ? 'Can not be empty' : '');
  const validateNewPassword = value =>
    value.length < 8 ? 'Password should have at least 8 characters' : '';
  const validateConfirmPassword = value =>
    (value.length === 0 && 'Can not be empty') ||
    (value.length < 8 && 'Password should have at least 8 characters') ||
    (value !== passwordState.newPassword && 'Passwords do not match') ||
    '';
  const validateCurrentPassword = value => (value.length === 0 ? 'Can not be empty' : '');

  const validateForm = validationState => {
    const formIsInvalid = Boolean(
      Object.keys(validationState).find(key => !isEmpty(validationState[key]))
    );
    return formIsInvalid && currentPasswordIsRequired && Boolean(validationState.currentPassword);
  };

  const onChangeFirstName = ({ target: { value } }) => {
    setValidationState({ ...validationState, firstName: validateName(value) });
    setEditorUserState({ ...editorUserState, firstName: value });
  };
  const onChangeLastName = ({ target: { value } }) => {
    setValidationState({ ...validationState, lastName: validateName(value) });
    setEditorUserState({ ...editorUserState, lastName: value });
  };

  const onChangeEmail = ({ target: { value } }) => {
    setValidationState({ ...validationState, email: validateEmail(value) });
    setCurrentPasswordIsRequired(value !== userState.email);
    setEditorUserState({ ...editorUserState, email: value });
  };
  const onChangeNewPassword = ({ target: { value } }) => {
    setCurrentPasswordIsRequired(value !== userState.password);
    setValidationState({ ...validationState, newPassword: validateNewPassword(value) });
    setPasswordState({ ...passwordState, newPassword: value });
  };
  const onChangeConfirmPassword = ({ target: { value } }) => {
    setValidationState({ ...validationState, confirmPassword: validateConfirmPassword(value) });
    setPasswordState({ ...passwordState, confirmPassword: value });
  };
  const onChangeCurrentPassword = ({ target: { value } }) => {
    setValidationState({ ...validationState, currentPassword: validateCurrentPassword(value) });
    setPasswordState({ ...passwordState, currentPassword: value });
  };

  return (
    <Modal
      title="Edit account"
      shouldCloseOnEscapePress={true}
      shouldCloseOnOverlayClick={true}
      isShown={showModal}
      onClose={() => setShowModal(false)}
      size="large">
      <Form>
        <TextField
          required
          validationMessage={validationState.firstName}
          id="first-name-field"
          name="first-name"
          value={editorUserState.firstName}
          onChange={onChangeFirstName}
          labelText="First Name"
          textInputProps={{ type: 'text', autoComplete: 'off' }}
        />
        <TextField
          required
          validationMessage={validationState.lastName}
          id="last-name-field"
          name="last-name"
          value={editorUserState.lastName}
          onChange={onChangeLastName}
          labelText="Last Name"
          textInputProps={{ type: 'text', autoComplete: 'off' }}
        />
        <TextField
          required
          id="email-field"
          name="email"
          value={editorUserState.email}
          onChange={onChangeEmail}
          labelText="Email"
          textInputProps={{ type: 'email', autoComplete: 'off' }}
          helpText="To confirm email changes enter your current newPassword and don’t forget to confirm the new email, you will find a confirmation link in your inbox soon."
        />
        <Subheading>Change Password</Subheading>
        <TextField
          validationMessage={validationState.newPassword}
          id="new-password-field"
          name="new-password"
          value={passwordState.newPassword}
          onChange={onChangeNewPassword}
          labelText="New Password"
          textInputProps={{ type: 'password', autoComplete: 'off' }}
          helpText="Create a unique newPassword with at least 8 characters"
        />
        <TextField
          validationMessage={validationState.confirmPassword}
          id="confirm-new-password-field"
          name="confirm-new-password"
          value={passwordState.confirmPassword}
          onChange={onChangeConfirmPassword}
          labelText="Confirm new password"
          textInputProps={{ type: 'password', autoComplete: 'off' }}
        />
        {currentPasswordIsRequired && (
          <>
            <Subheading>Confirm changes</Subheading>
            <TextField
              required
              validationMessage={validationState.currentPassword}
              id="current-password-field"
              name="current-password"
              value={passwordState.currentPassword}
              onChange={onChangeCurrentPassword}
              labelText="Current Password"
              textInputProps={{ type: 'password', autoComplete: 'off' }}
            />
          </>
        )}
        <CheckboxField
          labelText="Allow Contentful to send information to external providers to help us improve the service"
          value={editorUserState.logAnalyticsFeature ? 'yes' : 'no'}
          onChange={() =>
            setEditorUserState({
              ...editorUserState,
              logAnalyticsFeature: !editorUserState.logAnalyticsFeature
            })
          }
          checked={editorUserState.logAnalyticsFeature === true}
          id="termsCheckboxYes"
        />
        <div className={styles.controlsPanel}>
          <Button
            onClick={() => submitForm({ passwordState, editorUserState })}
            type="submit"
            buttonType="positive"
            disabled={validateForm(validationState)}>
            Save changes
          </Button>
          <Button
            className={styles.marginLeftM}
            onClick={() => setShowModal(false)}
            buttonType="muted">
            Cancel
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

AccountEditorModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  userState: userAccountDataShape.isRequired,
  setUserState: PropTypes.func.isRequired
};

export default AccountEditorModal;
