import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import AccountDetails from './AccountDetails';
import { ModalLauncher } from 'core/components/ModalLauncher';

describe('AccountDetails', () => {
  const makeUser = (custom) => {
    return Object.assign(
      {
        firstName: 'Jack',
        lastName: 'Nicholson',
        email: 'jack.nicholson@example.com',
        ssoLoginOnly: false,
        passwordSet: true,
        identities: [],
      },
      custom
    );
  };

  const build = ({ user, onEdit = () => {}, onChangePassword = () => {} }) => {
    return render(
      <AccountDetails user={user} onEdit={onEdit} onChangePassword={onChangePassword} />
    );
  };

  it('should allow the user to change their password if the passowrd is set', () => {
    const user = makeUser({
      passwordSet: true,
    });

    const { queryByTestId } = build({ user });

    expect(queryByTestId('change-password-cta')).toBeVisible();
    expect(queryByTestId('add-password-cta')).toBeNull();
  });

  it('should allow the user to set their password if the password is not set', () => {
    const user = makeUser({
      passwordSet: false,
    });

    const { queryByTestId } = build({ user });

    expect(queryByTestId('add-password-cta')).toBeVisible();
    expect(queryByTestId('change-password-cta')).toBeNull();
  });

  it('should show the open identities section', () => {
    const user = makeUser();

    const { queryByTestId } = build({ user });

    expect(queryByTestId('identities-section')).toBeVisible();
  });

  it('should not call onEdit if the user attempts to edit their profile but cancels', async () => {
    ModalLauncher.open.mockResolvedValueOnce(false);

    const onEdit = jest.fn();
    const user = makeUser();

    const { queryByTestId } = build({ user, onEdit });

    expect(queryByTestId('user-full-name')).toHaveTextContent('Jack Nicholson');

    fireEvent.click(queryByTestId('edit-user-account-details'));

    await waitFor(() => expect(onEdit).not.toHaveBeenCalled());
  });

  it('should call onEdit if the UserEditModal is confirmed', async () => {
    ModalLauncher.open.mockResolvedValueOnce(
      makeUser({
        firstName: 'Bruce',
        lastName: 'Wayne',
      })
    );

    const onEdit = jest.fn();
    const user = makeUser();

    const { queryByTestId } = build({ user, onEdit });

    expect(queryByTestId('user-full-name')).toHaveTextContent('Jack Nicholson');

    fireEvent.click(queryByTestId('edit-user-account-details'));

    await waitFor(() => expect(onEdit).toHaveBeenCalled());
  });

  it('should not call onChangePassword if the ChangePasswordModal result is false', async () => {
    ModalLauncher.open.mockResolvedValueOnce(false);

    const user = makeUser({
      passwordSet: false,
    });

    const onChangePassword = jest.fn();
    const { queryByTestId } = build({ user, onChangePassword });

    expect(queryByTestId('add-password-cta')).toBeVisible();

    fireEvent.click(queryByTestId('add-password-cta'));

    await waitFor(() => expect(onChangePassword).not.toHaveBeenCalled());
  });

  it('should call onChangePassword if the ChangePasswordModal result is not false', async () => {
    ModalLauncher.open.mockResolvedValueOnce(
      makeUser({
        passwordSet: true,
      })
    );

    const onChangePassword = jest.fn();
    const user = makeUser({
      passwordSet: false,
    });

    const { queryByTestId } = build({ user, onChangePassword });

    expect(queryByTestId('add-password-cta')).toBeVisible();

    fireEvent.click(queryByTestId('add-password-cta'));

    await waitFor(() => expect(onChangePassword).toHaveBeenCalled());
  });

  it('should show the unconfirmed email if one is present', () => {
    const unconfirmedEmail = 'jack.torrance@overlookhotel.com';

    const user = makeUser({
      unconfirmedEmail,
    });

    const { queryByTestId } = build({ user });

    expect(queryByTestId('unconfirmed-email')).toHaveTextContent(
      `Unconfirmed email: ${unconfirmedEmail}`
    );
  });

  describe('SSO restricted', () => {
    // passwordSet is set to true by default above
    const user = makeUser({
      ssoLoginOnly: true,
    });

    it('should tell the user that the account is SSO enabled', () => {
      const { queryByTestId } = build({ user });

      expect(queryByTestId('sso-active')).toBeVisible();
    });

    it('should not allow the user to set their password', () => {
      const { queryByTestId } = build({ user });

      expect(queryByTestId('add-password-cta')).toBeNull();
      expect(queryByTestId('change-password-cta')).toBeNull();
    });

    it('should not show the open identities section', () => {
      const { queryByTestId } = build({ user });

      expect(queryByTestId('identities-section')).toBeNull();
    });
  });
});
