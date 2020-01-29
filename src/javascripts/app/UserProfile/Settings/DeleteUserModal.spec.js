import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import { Notification } from '@contentful/forma-36-react-components';
import DeleteUserModal from './DeleteUserModal';
import { deleteUserAccount } from './AccountRepository';

jest.mock('./AccountRepository', () => ({
  deleteUserAccount: jest.fn()
}));

describe('DeleteUser', () => {
  const build = custom => {
    const opts = Object.assign(
      {},
      {
        singleOwnerOrganizations: [],
        onConfirm: () => {},
        onCancel: () => {}
      },
      custom
    );

    return render(<DeleteUserModal isShown {...opts} />);
  };

  beforeEach(() => {
    deleteUserAccount.mockResolvedValueOnce();
  });

  it('should default to selecting the "other" reason', () => {
    const { queryByTestId } = build();

    const otherRadio = queryByTestId('reason-other').querySelector('input');

    expect(otherRadio).toHaveAttribute('checked');
  });

  it('should call onCancel if the cancel button is pressed', () => {
    const onCancel = jest.fn();

    const { queryByTestId } = build({ onCancel });

    fireEvent.click(queryByTestId('cancel'));

    expect(onCancel).toHaveBeenCalled();
  });

  it('should submit the API request with the reason key and empty details if no details are given', async () => {
    const { queryByTestId } = build();

    fireEvent.click(queryByTestId('reason-not_useful').querySelector('input'));

    fireEvent.click(queryByTestId('confirm-delete-account-button'));

    await wait();

    expect(deleteUserAccount).toHaveBeenCalledWith({
      reason: 'not_useful',
      description: ''
    });
  });

  it('should submit the API request with the reason key and details if details are given', async () => {
    const { queryByTestId } = build();

    fireEvent.click(queryByTestId('reason-dont_understand').querySelector('input'));
    fireEvent.change(queryByTestId('cancellation-details'), {
      target: { value: 'This is too complicated!!!!' }
    });
    fireEvent.click(queryByTestId('confirm-delete-account-button'));

    await wait();

    expect(deleteUserAccount).toHaveBeenCalledWith({
      reason: 'dont_understand',
      description: 'This is too complicated!!!!'
    });
  });

  it('should call onConfirm if the API request was successful', async () => {
    const onConfirm = jest.fn();

    const { queryByTestId } = build({ onConfirm });

    fireEvent.click(queryByTestId('confirm-delete-account-button'));

    await wait();

    expect(onConfirm).toHaveBeenCalled();
  });

  it('should show a notification if there was an error while deleting the user from the API', async () => {
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
    deleteUserAccount.mockReset().mockRejectedValueOnce();

    const onConfirm = jest.fn();

    const { queryByTestId } = build({ onConfirm });

    fireEvent.click(queryByTestId('confirm-delete-account-button'));

    await wait();

    expect(Notification.error).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should show a warning if any orgs are only owned by this user', () => {
    const { queryByTestId } = build({ singleOwnerOrganizations: [{ name: 'Awesome org' }] });

    expect(queryByTestId('single-owner-orgs-warning')).toBeVisible();
  });

  it('should not show a warning if no orgs are only owned by this user', () => {
    const { queryByTestId } = build({ singleOwnerOrganizations: [] });

    expect(queryByTestId('single-owner-orgs-warning')).toBeNull();
  });
});
