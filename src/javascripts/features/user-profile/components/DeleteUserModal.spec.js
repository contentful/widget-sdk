import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { deleteUserAccount } from '../services/AccountRepository';
import { DeleteUserModal } from './DeleteUserModal';

jest.mock('../services/AccountRepository', () => ({
  deleteUserAccount: jest.fn(),
}));

const mockPassword = 'password123';

function build(customProps) {
  const props = {
    singleOwnerOrganizations: [],
    onConfirm: () => {},
    onCancel: () => {},
    ...customProps,
  };

  render(<DeleteUserModal isShown {...props} />);

  return {
    get passwordInput() {
      return screen.queryByTestId('password').querySelector('input');
    },
    get confirmButton() {
      return screen.queryByTestId('delete-user-confirm');
    },
    get cancelButton() {
      return screen.queryByTestId('delete-user-cancel');
    },
    getRadioByTestId(testId) {
      return screen.queryByTestId(testId).querySelector('input');
    },
  };
}

describe('DeleteUserModal', () => {
  beforeEach(() => {
    deleteUserAccount.mockResolvedValueOnce();
  });

  it('should default to selecting the "other" reason', () => {
    const { getRadioByTestId } = build();
    const otherRadio = getRadioByTestId('reason-other');

    expect(otherRadio).toHaveAttribute('checked');
  });

  it('should call onCancel if the cancel button is pressed', () => {
    const onCancel = jest.fn();
    const { cancelButton } = build({ onCancel });

    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it('should not be able to submit if a password was not given', () => {
    const { confirmButton } = build();

    expect(confirmButton).toBeDisabled();
    fireEvent.click(confirmButton);
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });

  it('should submit the API request with the reason key and empty details if no details are given', async () => {
    const { getRadioByTestId, passwordInput, confirmButton } = build();
    const notUsefulRadio = getRadioByTestId('reason-not_useful');

    fireEvent.click(notUsefulRadio);
    fireEvent.change(passwordInput, {
      target: { value: mockPassword },
    });
    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(deleteUserAccount).toHaveBeenCalledWith({
        reason: 'not_useful',
        description: '',
        password: mockPassword,
      })
    );
  });

  it('should submit the API request with the reason key and details if details are given', async () => {
    const { getRadioByTestId, passwordInput, confirmButton } = build();

    const dontUnderstandRadio = getRadioByTestId('reason-dont_understand');
    const additionalDetailsTextarea = screen
      .queryByTestId('cancellation-details')
      .querySelector('textarea');

    fireEvent.click(dontUnderstandRadio);
    fireEvent.change(additionalDetailsTextarea, {
      target: { value: 'This is too complicated!' },
    });
    fireEvent.change(passwordInput, {
      target: { value: mockPassword },
    });
    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(deleteUserAccount).toHaveBeenCalledWith({
        reason: 'dont_understand',
        description: 'This is too complicated!',
        password: mockPassword,
      })
    );
  });

  it('should call onConfirm if the API request was successful', async () => {
    const onConfirm = jest.fn();
    const { passwordInput, confirmButton } = build({ onConfirm });

    fireEvent.change(passwordInput, {
      target: { value: 'password123' },
    });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
  });

  it('should show an error message if there was an error while deleting the user from the API', async () => {
    const error = new Error('Something went wrong');
    deleteUserAccount.mockReset().mockRejectedValueOnce(error);

    const onConfirm = jest.fn();
    const { passwordInput, confirmButton } = build({ onConfirm });

    fireEvent.change(passwordInput, {
      target: { value: 'password123' },
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId('password').querySelector('p[class^="ValidationMessage"]')
      ).toBeVisible();
    });

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should show a warning if any orgs are only owned by this user', () => {
    build({ singleOwnerOrganizations: [{ name: 'Awesome org' }] });

    const warning = screen.queryByTestId('single-owner-orgs-warning');
    expect(warning).toBeVisible();
  });

  it('should not show a warning if no orgs are only owned by this user', () => {
    build({ singleOwnerOrganizations: [] });

    const warning = screen.queryByTestId('single-owner-orgs-warning');
    expect(warning).toBeNull();
  });
});
