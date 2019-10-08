import React from 'react';
import { cleanup, fireEvent, render, wait } from '@testing-library/react';
import { Notification } from '@contentful/forma-36-react-components';
import IdentitiesSection from './IdentitiesSection';
import { deleteUserIdentityData } from './AccountRepository';

import '@testing-library/jest-dom/extend-expect';

jest.mock('./AccountRepository', () => ({
  deleteUserIdentityData: jest.fn()
}));

describe('IdentitiesSection', () => {
  beforeEach(() => {
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
  });

  afterEach(cleanup);

  it('should Google, Github, and Twitter as available if no identities are passed in', () => {
    const { getByTestId } = render(
      <IdentitiesSection userHasPassword={true} identities={[]} onRemoveIdentity={() => {}} />
    );
    expect(getByTestId('add-google_oauth2-identity-form')).toBeVisible();
    expect(getByTestId('add-github-identity-form')).toBeVisible();
    expect(getByTestId('add-twitter-identity-form')).toBeVisible();
  });

  it('should show the used providers separately', () => {
    const { getByTestId, queryByTestId } = render(
      <IdentitiesSection
        userHasPassword={true}
        identities={[{ provider: 'google_oauth2', sys: { id: 11111 } }]}
        onRemoveIdentity={() => {}}
      />
    );
    expect(getByTestId('remove-google_oauth2-button')).toBeVisible();
    expect(queryByTestId('add-google_oauth2-identity-form')).toBeNull();
    expect(getByTestId('add-github-identity-form')).toBeVisible();
    expect(getByTestId('add-twitter-identity-form')).toBeVisible();
  });

  it('should not allow the user to remove the only provider if no password is set', () => {
    const { getByTestId, queryByTestId } = render(
      <IdentitiesSection
        userHasPassword={false}
        identities={[{ provider: 'google_oauth2', sys: { id: 11111 } }]}
        onRemoveIdentity={() => {}}
      />
    );
    expect(queryByTestId('remove-google_oauth2-button')).toBeNull();
    expect(queryByTestId('add-google_oauth2-identity-form')).toBeNull();
    expect(getByTestId('add-github-identity-form')).toBeVisible();
    expect(getByTestId('add-twitter-identity-form')).toBeVisible();
  });

  it('should allow the user to remove any provider if a password is set', () => {
    const { getByTestId, queryByTestId } = render(
      <IdentitiesSection
        userHasPassword={true}
        identities={[{ provider: 'google_oauth2', sys: { id: 11111 } }]}
        onRemoveIdentity={() => {}}
      />
    );
    expect(getByTestId('remove-google_oauth2-button')).toBeVisible();
    expect(queryByTestId('add-google_oauth2-identity-form')).toBeNull();
    expect(getByTestId('add-github-identity-form')).toBeVisible();
    expect(getByTestId('add-twitter-identity-form')).toBeVisible();
  });

  it('should confirm with the user before attempting to delete the identity', () => {
    const { getByTestId } = render(
      <IdentitiesSection
        userHasPassword={true}
        identities={[{ provider: 'google_oauth2', sys: { id: 11111 } }]}
        onRemoveIdentity={() => {}}
      />
    );
    fireEvent.click(getByTestId('remove-google_oauth2-button'));
    expect(getByTestId('dialog-remove-google_oauth2-identity')).toBeVisible();
  });

  it('should not delete the identity if the user does not confirm (cancels)', () => {
    const { getByTestId } = render(
      <IdentitiesSection
        userHasPassword={true}
        identities={[{ provider: 'google_oauth2', sys: { id: 11111 } }]}
        onRemoveIdentity={() => {}}
      />
    );
    fireEvent.click(getByTestId('remove-google_oauth2-button'));
    expect(getByTestId('dialog-remove-google_oauth2-identity')).toBeVisible();
    fireEvent.click(getByTestId('cancel-remove-google_oauth2-identity'));
    expect(getByTestId('dialog-remove-google_oauth2-identity')).toBeVisible();
  });

  it('should show a notification if the delete API call fails', async () => {
    deleteUserIdentityData.mockRejectedValue(new Error('Async error'));
    const { getByTestId } = render(
      <IdentitiesSection
        userHasPassword={true}
        identities={[{ provider: 'google_oauth2', sys: { id: 11111 } }]}
        onRemoveIdentity={() => {}}
      />
    );
    fireEvent.click(getByTestId('remove-google_oauth2-button'));
    expect(getByTestId('dialog-remove-google_oauth2-identity')).toBeVisible();
    fireEvent.click(getByTestId('confirm-remove-google_oauth2-identity'));
    expect(deleteUserIdentityData).toBeCalled();
    await wait();
    expect(Notification.error).toHaveBeenCalledWith(
      'An error occurred while removing Google from your profile.'
    );
  });

  it('should call onRemoveIdentity if the delete API call succeeds', async () => {
    deleteUserIdentityData.mockResolvedValueOnce({});
    const onRemoveIdentity = jest.fn();
    const { getByTestId } = render(
      <IdentitiesSection
        userHasPassword={true}
        identities={[{ provider: 'google_oauth2', sys: { id: 11111 } }]}
        onRemoveIdentity={onRemoveIdentity}
      />
    );
    fireEvent.click(getByTestId('remove-google_oauth2-button'));
    expect(getByTestId('dialog-remove-google_oauth2-identity')).toBeVisible();
    fireEvent.click(getByTestId('confirm-remove-google_oauth2-identity'));
    expect(deleteUserIdentityData).toBeCalled();
    await wait();
    expect(onRemoveIdentity).toBeCalled();
    expect(Notification.success).toHaveBeenCalledWith(
      'Google successfully removed from your profile.'
    );
  });
});
