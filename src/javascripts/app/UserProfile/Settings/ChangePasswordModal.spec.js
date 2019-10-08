import React from 'react';
import { render, cleanup, fireEvent, within, wait } from '@testing-library/react';
import ChangePasswordModal from './ChangePasswordModal';
import { updateUserData } from './AccountRepository';
import { Notification } from '@contentful/forma-36-react-components';

import '@testing-library/jest-dom/extend-expect';

jest.mock('./AccountRepository', () => ({
  updateUserData: jest.fn()
}));

describe('ChangePasswordModal', () => {
  const build = custom => {
    const opts = Object.assign(
      {},
      {
        hasPassword: true,
        onConfirm: () => {},
        onCancel: () => {}
      },
      custom
    );

    const user = {
      passwordSet: opts.hasPassword,
      sys: {
        version: 3
      }
    };

    return render(
      <ChangePasswordModal
        user={user}
        onConfirm={opts.onConfirm}
        onCancel={opts.onCancel}
        isShown
      />
    );
  };

  const getValidationMessage = ele => {
    try {
      return within(ele).queryByTestId('cf-ui-validation-message').textContent;
    } catch (_) {
      return null;
    }
  };

  afterEach(cleanup);

  it('should call onCancel if the user presses the cancel button', () => {
    const onCancel = jest.fn();

    const { queryByTestId } = build({ onCancel });

    fireEvent.click(queryByTestId('cancel'));

    expect(onCancel).toHaveBeenCalled();
  });

  it('should disable the submit button when the modal first loads', () => {
    const { queryByTestId } = build();

    expect(queryByTestId('confirm-change-password')).toHaveAttribute('disabled');
  });

  it('should enable the submit button on first field interaction', () => {
    const { queryByTestId } = build();

    expect(queryByTestId('confirm-change-password')).toHaveAttribute('disabled');

    fireEvent.change(queryByTestId('new-password').querySelector('input'), {
      target: { value: 'a' }
    });

    expect(queryByTestId('confirm-change-password')).not.toHaveAttribute('disabled');
  });

  it('should warn on blur when typing in a trimmed new password less than 8 characters', async () => {
    const { queryByTestId } = build();
    const newPasswordField = queryByTestId('new-password');
    const input = newPasswordField.querySelector('input');

    expect(getValidationMessage(newPasswordField)).toBeNull();

    fireEvent.change(input, { target: { value: '      mypass' } });

    expect(getValidationMessage(newPasswordField)).toBeNull();

    fireEvent.blur(input);

    expect(getValidationMessage(newPasswordField)).toEqual(expect.any(String));
  });

  it('should warn on blur when the current password field is empty', () => {
    const { queryByTestId } = build();
    const currentPasswordField = queryByTestId('current-password');
    const input = currentPasswordField.querySelector('input');

    expect(getValidationMessage(currentPasswordField)).toBeNull();

    fireEvent.blur(input);

    expect(getValidationMessage(currentPasswordField)).toEqual(expect.any(String));
  });

  it('should warn on blur when typing in a trimmed new password confirmation less than 8 characters', () => {
    const { queryByTestId } = build();
    const newPasswordConfirmField = queryByTestId('new-password-confirm');
    const input = newPasswordConfirmField.querySelector('input');

    expect(getValidationMessage(newPasswordConfirmField)).toBeNull();

    fireEvent.change(input, { target: { value: '      myconf' } });

    expect(getValidationMessage(newPasswordConfirmField)).toBeNull();

    fireEvent.blur(input);

    expect(getValidationMessage(newPasswordConfirmField)).toEqual(expect.any(String));
  });

  it('should warn on blur if the password confirmation does not match the password', () => {
    const { queryByTestId } = build();
    const newPasswordField = queryByTestId('new-password');
    const newPasswordConfirmField = queryByTestId('new-password-confirm');

    const passwordInput = newPasswordField.querySelector('input');
    const confirmInput = newPasswordConfirmField.querySelector('input');

    expect(getValidationMessage(newPasswordField)).toBeNull();
    expect(getValidationMessage(newPasswordConfirmField)).toBeNull();

    fireEvent.change(passwordInput, { target: { value: 'my-awesome-password' } });

    expect(getValidationMessage(newPasswordField)).toBeNull();
    expect(getValidationMessage(newPasswordConfirmField)).toBeNull();

    fireEvent.blur(passwordInput);

    expect(getValidationMessage(newPasswordField)).toBeNull();

    fireEvent.change(confirmInput, { target: { value: 'my-confirmation-that-does-not-match' } });
    fireEvent.blur(confirmInput);

    expect(getValidationMessage(newPasswordConfirmField)).toEqual(expect.any(String));
  });

  it('should not submit if there are errors on the form when submitting', async () => {
    const { queryByTestId } = build();
    const newPasswordField = queryByTestId('new-password');
    const newPasswordConfirmField = queryByTestId('new-password-confirm');
    const submitButton = queryByTestId('confirm-change-password');

    const passwordInput = newPasswordField.querySelector('input');
    const confirmInput = newPasswordConfirmField.querySelector('input');

    fireEvent.change(passwordInput, { target: { value: 'my-awesome-password' } });
    fireEvent.blur(passwordInput);

    fireEvent.change(confirmInput, { target: { value: 'my-wrong-confirmation' } });
    fireEvent.blur(confirmInput);

    fireEvent.click(submitButton);

    await wait();

    expect(updateUserData).not.toBeCalled();
  });

  it('should submit if there are no errors on the form when submitting', async () => {
    const { queryByTestId } = build();

    const currentPasswordField = queryByTestId('current-password');
    const newPasswordField = queryByTestId('new-password');
    const newPasswordConfirmField = queryByTestId('new-password-confirm');
    const submitButton = queryByTestId('confirm-change-password');

    const currentInput = currentPasswordField.querySelector('input');
    const passwordInput = newPasswordField.querySelector('input');
    const confirmInput = newPasswordConfirmField.querySelector('input');

    fireEvent.change(currentInput, { target: { value: 'my-current-password' } });
    fireEvent.change(passwordInput, { target: { value: 'my-awesome-password' } });
    fireEvent.change(confirmInput, { target: { value: 'my-awesome-password' } });

    fireEvent.click(submitButton);

    await wait();

    expect(updateUserData).toBeCalled();
  });

  it('should warn if the server returns an error with insecure name for the password path', async () => {
    const err = new Error();
    err.data = {
      details: {
        errors: [
          {
            name: 'insecure',
            path: 'password'
          }
        ]
      },
      sys: {
        type: 'Error'
      }
    };

    updateUserData.mockRejectedValueOnce(err);

    const { queryByTestId } = build({ hasPassword: false });

    const newPasswordField = queryByTestId('new-password');
    const newPasswordConfirmField = queryByTestId('new-password-confirm');
    const submitButton = queryByTestId('confirm-change-password');

    const passwordInput = newPasswordField.querySelector('input');
    const confirmInput = newPasswordConfirmField.querySelector('input');

    fireEvent.change(passwordInput, { target: { value: 'my-awesome-password' } });
    fireEvent.change(confirmInput, { target: { value: 'my-awesome-password' } });

    fireEvent.click(submitButton);

    await wait();

    expect(getValidationMessage(newPasswordField)).toEqual(expect.any(String));
  });

  it('should show a notification if an unknown error occurs', async () => {
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
    const err = new Error();
    updateUserData.mockRejectedValueOnce(err);

    const { queryByTestId } = build({ hasPassword: false });

    const newPasswordField = queryByTestId('new-password');
    const newPasswordConfirmField = queryByTestId('new-password-confirm');
    const submitButton = queryByTestId('confirm-change-password');

    const passwordInput = newPasswordField.querySelector('input');
    const confirmInput = newPasswordConfirmField.querySelector('input');

    fireEvent.change(passwordInput, { target: { value: 'my-awesome-password' } });
    fireEvent.change(confirmInput, { target: { value: 'my-awesome-password' } });

    fireEvent.click(submitButton);

    await wait();

    expect(Notification.error).toBeCalled();
  });

  it('should fire the onConfirm with the response data if successful', async () => {
    const onConfirm = jest.fn();
    const { queryByTestId } = build({ hasPassword: false, onConfirm });

    const newPasswordField = queryByTestId('new-password');
    const newPasswordConfirmField = queryByTestId('new-password-confirm');
    const submitButton = queryByTestId('confirm-change-password');

    const passwordInput = newPasswordField.querySelector('input');
    const confirmInput = newPasswordConfirmField.querySelector('input');

    fireEvent.change(passwordInput, { target: { value: 'my-awesome-password' } });
    fireEvent.change(confirmInput, { target: { value: 'my-awesome-password' } });

    fireEvent.click(submitButton);

    await wait();

    expect(onConfirm).toBeCalled();
  });
});
