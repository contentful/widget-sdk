import React from 'react';
import { render, cleanup, fireEvent, wait } from '@testing-library/react';
import AccountDetails from './AccountDetails';
import * as ModalLauncher from 'app/common/ModalLauncher.es6';
import 'jest-dom/extend-expect';

describe('AccountDetails', () => {
  const makeUser = custom => {
    return Object.assign(
      {
        firstName: 'Jack',
        lastName: 'Nicholson',
        email: 'jack.nicholson@example.com',
        ssoLoginOnly: false,
        passwordSet: true,
        identities: []
      },
      custom
    );
  };
  const build = user => {
    return render(<AccountDetails userData={user} />);
  };

  afterEach(cleanup);

  it('should allow the user to change their password if the passowrd is set', () => {
    const user = makeUser({
      passwordSet: true
    });

    const { queryByTestId } = build(user);

    expect(queryByTestId('change-password-cta')).toBeVisible();
    expect(queryByTestId('add-password-cta')).toBeNull();
  });

  it('should allow the user to set their password if the password is not set', () => {
    const user = makeUser({
      passwordSet: false
    });

    const { queryByTestId } = build(user);

    expect(queryByTestId('add-password-cta')).toBeVisible();
    expect(queryByTestId('change-password-cta')).toBeNull();
  });

  it('should show the open identities section', () => {
    const user = makeUser();

    const { queryByTestId } = build(user);

    expect(queryByTestId('identities-section')).toBeVisible();
  });

  it('should do nothing if the user attempts to edit their profile but cancels', async () => {
    ModalLauncher.open.mockResolvedValueOnce(false);

    const user = makeUser();

    const { queryByTestId } = build(user);

    expect(queryByTestId('user-full-name')).toHaveTextContent('Jack Nicholson');

    fireEvent.click(queryByTestId('edit-user-account-details'));

    await wait();

    expect(queryByTestId('user-full-name')).toHaveTextContent('Jack Nicholson');
  });

  it('should update the user if the UserEditModal is confirmed', async () => {
    ModalLauncher.open.mockResolvedValueOnce(
      makeUser({
        firstName: 'Bruce',
        lastName: 'Wayne'
      })
    );

    const user = makeUser();

    const { queryByTestId } = build(user);

    expect(queryByTestId('user-full-name')).toHaveTextContent('Jack Nicholson');

    fireEvent.click(queryByTestId('edit-user-account-details'));

    await wait();

    expect(queryByTestId('user-full-name')).toHaveTextContent('Bruce Wayne');
  });

  it('should do nothing if the ChangePasswordModal result is false', async () => {
    ModalLauncher.open.mockResolvedValueOnce(false);

    const user = makeUser({
      passwordSet: false
    });

    const { queryByTestId } = build(user);

    expect(queryByTestId('add-password-cta')).toBeVisible();

    fireEvent.click(queryByTestId('edit-user-account-details'));

    await wait();

    expect(queryByTestId('add-password-cta')).toBeVisible();
  });

  it('should update the user if the ChangePasswordModal result is not false', async () => {
    ModalLauncher.open.mockResolvedValueOnce(
      makeUser({
        passwordSet: true
      })
    );

    const user = makeUser({
      passwordSet: false
    });

    const { queryByTestId } = build(user);

    expect(queryByTestId('add-password-cta')).toBeVisible();

    fireEvent.click(queryByTestId('edit-user-account-details'));

    await wait();

    expect(queryByTestId('change-password-cta')).toBeVisible();
  });

  it('should show the unconfirmed email if one is present', () => {
    const unconfirmedEmail = 'jack.torrance@overlookhotel.com';

    const user = makeUser({
      unconfirmedEmail
    });

    const { queryByTestId } = build(user);

    expect(queryByTestId('unconfirmed-email')).toHaveTextContent(
      `Unconfirmed email: ${unconfirmedEmail}`
    );
  });

  describe('SSO restricted', () => {
    // passwordSet is set to true by default above
    const user = makeUser({
      ssoLoginOnly: true
    });

    it('should tell the user that the account is SSO enabled', () => {
      const { queryByTestId } = build(user);

      expect(queryByTestId('sso-active')).toBeVisible();
    });

    it('should not allow the user to set their password', () => {
      const { queryByTestId } = build(user);

      expect(queryByTestId('add-password-cta')).toBeNull();
      expect(queryByTestId('change-password-cta')).toBeNull();
    });

    it('should not show the open identities section', () => {
      const { queryByTestId } = build(user);

      expect(queryByTestId('identities-section')).toBeNull();
    });
  });
});
