import React from 'react';
import { render, cleanup, fireEvent, within, wait } from '@testing-library/react';
import { Notification } from '@contentful/forma-36-react-components';
import UserEditModal from './UserEditModal';
import { updateUserData } from './AccountRepository';

import '@testing-library/jest-dom/extend-expect';

jest.mock('./AccountRepository', () => ({
  updateUserData: jest.fn()
}));

describe('UserEditModal', () => {
  const build = custom => {
    const opts = Object.assign(
      {
        passwordSet: true,
        onConfirm: () => {},
        onCancel: () => {}
      },
      custom
    );

    const user = {
      firstName: 'Hans',
      lastName: 'Zimmer',
      email: 'hans@hanszimmer.com',
      passwordSet: opts.passwordSet,
      sys: {
        version: 3
      }
    };

    return render(
      <UserEditModal user={user} onConfirm={opts.onConfirm} onCancel={opts.onCancel} isShown />
    );
  };

  const makeError = detailsErrors => {
    const err = new Error();
    err.data = {
      details: {
        errors: detailsErrors
      },
      sys: {
        type: 'Error'
      }
    };

    return err;
  };

  const getValidationMessage = ele => {
    try {
      return within(ele).queryByTestId('cf-ui-validation-message').textContent;
    } catch (_) {
      return null;
    }
  };

  beforeEach(() => {
    updateUserData.mockResolvedValueOnce({});
  });

  afterEach(cleanup);

  it('should call onCancel if the user presses the cancel button', () => {
    const onCancel = jest.fn();
    const { queryByTestId } = build({ onCancel });

    fireEvent.click(queryByTestId('cancel-account-data-changes'));

    expect(onCancel).toHaveBeenCalled();
  });

  it('should disable the submit button when the modal first loads', () => {
    const { queryByTestId } = build();

    expect(queryByTestId('confirm-account-data-changes')).toHaveAttribute('disabled');
  });

  it('should enable the submit button on first field interaction', () => {
    const { queryByTestId } = build();

    fireEvent.change(queryByTestId('first-name-field').querySelector('input'), {
      target: { value: '' }
    });

    expect(queryByTestId('confirm-account-data-changes')).not.toHaveAttribute('disabled');
  });

  it('should warn on change when typing in a empty trimmed first name', () => {
    const { queryByTestId } = build();

    const firstNameField = queryByTestId('first-name-field');
    const input = firstNameField.querySelector('input');

    expect(getValidationMessage(firstNameField)).toBeNull();

    fireEvent.change(input, { target: { value: '        ' } });

    expect(getValidationMessage(firstNameField)).toEqual(expect.any(String));
  });

  it('should warn on change when typing in a empty trimmed last name', () => {
    const { queryByTestId } = build();

    const lastNameField = queryByTestId('last-name-field');
    const input = lastNameField.querySelector('input');

    expect(getValidationMessage(lastNameField)).toBeNull();

    fireEvent.change(input, { target: { value: '        ' } });

    expect(getValidationMessage(lastNameField)).toEqual(expect.any(String));
  });

  it('should warn on change when typing in a empty trimmed email', () => {
    const { queryByTestId } = build();

    const emailField = queryByTestId('email-field');
    const input = emailField.querySelector('input');

    expect(getValidationMessage(emailField)).toBeNull();

    fireEvent.change(input, { target: { value: '        ' } });

    expect(getValidationMessage(emailField)).toEqual(expect.any(String));
  });

  it('should show help text only if the email has changed', () => {
    const { queryByTestId } = build();

    const emailField = queryByTestId('email-field');
    const input = emailField.querySelector('input');

    expect(within(emailField).queryByTestId('cf-ui-help-text')).toBeNull();

    fireEvent.change(input, { target: { value: 'florian@hanszimmer.com' } });

    const helpText = within(emailField).queryByTestId('cf-ui-help-text').textContent;

    expect(helpText).toEqual(expect.any(String));
  });

  it('should only show the current password input if the email has changed and the user has a password', () => {
    const { queryByTestId } = build();

    const emailInput = queryByTestId('email-field').querySelector('input');

    expect(queryByTestId('current-password-field')).toBeNull();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.blur(emailInput);

    expect(queryByTestId('current-password-field')).toBeVisible();
  });

  it('should not show the current password input if the email has changed but the user has no password', () => {
    const { queryByTestId } = build({ passwordSet: false });

    const emailInput = queryByTestId('email-field').querySelector('input');

    expect(queryByTestId('current-password-field')).toBeNull();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.blur(emailInput);

    expect(queryByTestId('current-password-field')).toBeNull();
  });

  it('should warn on blur if the password is empty', () => {
    const { queryByTestId } = build();

    const emailInput = queryByTestId('email-field').querySelector('input');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.blur(emailInput);

    const passwordField = queryByTestId('current-password-field');
    const passwordInput = passwordField.querySelector('input');

    expect(getValidationMessage(passwordField)).toBeNull();

    fireEvent.change(passwordInput, { target: { value: '' } });

    expect(getValidationMessage(passwordField)).toBeNull();

    fireEvent.blur(passwordInput);

    expect(getValidationMessage(passwordField)).toEqual(expect.any(String));
  });

  it('should not fire an API request if there are any errors on the form', () => {
    const { queryByTestId } = build();

    const firstNameInput = queryByTestId('first-name-field').querySelector('input');

    fireEvent.change(firstNameInput, { target: { value: '        ' } });
    fireEvent.blur(firstNameInput);

    fireEvent.click(queryByTestId('confirm-account-data-changes'));

    expect(updateUserData).not.toHaveBeenCalled();
  });

  it('should fire an API request if there are no errors on the form when submitting', async () => {
    const { queryByTestId } = build();

    const emailInput = queryByTestId('email-field').querySelector('input');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.blur(emailInput);

    const passwordInput = queryByTestId('current-password-field').querySelector('input');

    fireEvent.change(passwordInput, { target: { value: 'my-current-password' } });

    fireEvent.click(queryByTestId('confirm-account-data-changes'));

    await wait();

    expect(updateUserData).toHaveBeenCalled();
  });

  it('should disable the button while the form is submitting', async () => {
    const { queryByTestId } = build();

    const firstNameInput = queryByTestId('first-name-field').querySelector('input');
    const submitButton = queryByTestId('confirm-account-data-changes');

    fireEvent.change(firstNameInput, { target: { value: 'Florian' } });
    fireEvent.blur(firstNameInput);

    expect(submitButton).not.toHaveAttribute('disabled');

    fireEvent.click(submitButton);

    expect(submitButton).toHaveAttribute('disabled');

    await wait();
  });

  it('should warn if the server returns an error with invalid name for the current_password path', async () => {
    const err = makeError([
      {
        name: 'invalid',
        path: 'current_password'
      }
    ]);
    updateUserData.mockReset().mockRejectedValueOnce(err);
    const { queryByTestId } = build();

    const emailInput = queryByTestId('email-field').querySelector('input');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.blur(emailInput);

    const passwordField = queryByTestId('current-password-field');
    const passwordInput = passwordField.querySelector('input');

    fireEvent.change(passwordInput, { target: { value: 'my-current-password' } });

    fireEvent.click(queryByTestId('confirm-account-data-changes'));

    await wait();

    const validationMessage = getValidationMessage(passwordField);

    expect(validationMessage).toEqual(expect.any(String));
  });

  it('should warn if the server returns an error with length name for the first_name path', async () => {
    const err = makeError([
      {
        name: 'length',
        path: 'first_name'
      }
    ]);
    updateUserData.mockReset().mockRejectedValueOnce(err);
    const { queryByTestId } = build();

    const firstNameField = queryByTestId('first-name-field');
    const firstNameInput = firstNameField.querySelector('input');

    fireEvent.change(firstNameInput, { target: { value: 'Florian' } });
    fireEvent.blur(firstNameInput);

    fireEvent.click(queryByTestId('confirm-account-data-changes'));

    await wait();

    const validationMessage = getValidationMessage(firstNameField);

    expect(validationMessage).toEqual(expect.any(String));
  });

  it('should warn if the server returns an error with length name for the last_name path', async () => {
    const err = makeError([
      {
        name: 'length',
        path: 'last_name'
      }
    ]);
    updateUserData.mockReset().mockRejectedValueOnce(err);
    const { queryByTestId } = build();

    const lastNameField = queryByTestId('last-name-field');
    const lastNameInput = lastNameField.querySelector('input');

    fireEvent.change(lastNameInput, { target: { value: 'Schmidt' } });
    fireEvent.blur(lastNameInput);

    fireEvent.click(queryByTestId('confirm-account-data-changes'));

    await wait();

    const validationMessage = getValidationMessage(lastNameField);

    expect(validationMessage).toEqual(expect.any(String));
  });

  it('should show an error notification if an unknown error occurs', async () => {
    jest.spyOn(Notification, 'error').mockImplementationOnce(() => {});

    const err = new Error();
    updateUserData.mockReset().mockRejectedValueOnce(err);
    const { queryByTestId } = build();

    const lastNameField = queryByTestId('last-name-field');
    const lastNameInput = lastNameField.querySelector('input');

    fireEvent.change(lastNameInput, { target: { value: 'Schmidt' } });
    fireEvent.blur(lastNameInput);

    fireEvent.click(queryByTestId('confirm-account-data-changes'));

    await wait();

    expect(Notification.error).toHaveBeenCalled();

    Notification.error.mockRestore();
  });

  it('should show a single notification if the request was successful but the email has not changed', async () => {
    jest.spyOn(Notification, 'success').mockImplementationOnce(() => {});
    const { queryByTestId } = build();

    const lastNameField = queryByTestId('last-name-field');
    const lastNameInput = lastNameField.querySelector('input');

    fireEvent.change(lastNameInput, { target: { value: 'Schmidt' } });
    fireEvent.blur(lastNameInput);

    fireEvent.click(queryByTestId('confirm-account-data-changes'));

    await wait();

    expect(Notification.success).toHaveBeenCalledTimes(1);

    Notification.success.mockRestore();
  });

  it('should show two notifications if the request was successful and the email has changed', async () => {
    const newEmail = 'florian@hanszimmer.com';

    jest.spyOn(Notification, 'success').mockImplementationOnce(() => {});
    jest.spyOn(Notification, 'warning').mockImplementationOnce(() => {});
    updateUserData.mockReset().mockResolvedValueOnce({
      unconfirmedEmail: newEmail
    });
    const { queryByTestId } = build();

    const emailField = queryByTestId('email-field');
    const emailInput = emailField.querySelector('input');

    fireEvent.change(emailInput, { target: { value: newEmail } });
    fireEvent.blur(emailInput);

    const passwordInput = queryByTestId('current-password-field').querySelector('input');

    fireEvent.change(passwordInput, { target: { value: 'my-current-password' } });

    fireEvent.click(queryByTestId('confirm-account-data-changes'));

    await wait();

    expect(Notification.warning).toHaveBeenCalledTimes(1);
    expect(Notification.success).toHaveBeenCalledTimes(1);

    Notification.warning.mockRestore();
    Notification.success.mockRestore();
  });

  it('should fire the onConfirm with the response data if successful', async () => {
    const onConfirm = jest.fn();
    const { queryByTestId } = build({ onConfirm });

    const lastNameField = queryByTestId('last-name-field');
    const lastNameInput = lastNameField.querySelector('input');

    fireEvent.change(lastNameInput, { target: { value: 'Schmidt' } });
    fireEvent.blur(lastNameInput);

    fireEvent.click(queryByTestId('confirm-account-data-changes'));

    await wait();

    expect(onConfirm).toHaveBeenCalled();
  });
});
