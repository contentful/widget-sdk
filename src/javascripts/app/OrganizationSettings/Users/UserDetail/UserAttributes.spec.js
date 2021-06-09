import React from 'react';
import * as fake from 'test/helpers/fakeFactory';
import { render, screen, fireEvent } from '@testing-library/react';
import UserAttributes from './UserAttributes';
import { orgRoles } from 'utils/MembershipUtils';
import {
  updateMembership,
  removeMembership,
  reinvite,
} from 'access_control/OrganizationMembershipRepository';
import { ModalLauncher, Notification } from '@contentful/forma-36-react-components';
import { MemoryRouter } from 'core/react-routing';

import { act } from 'react-dom/test-utils';

const mockMember = fake.OrganizationMembership('member', 'active');
const mockDeveloper = fake.OrganizationMembership('developer', 'active');
const mockOwner = fake.OrganizationMembership('owner', 'active');
const pendingMember = fake.OrganizationMembership('member', 'pending');
const onRoleChangeCb = jest.fn();

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  updateMembership: jest.fn(async () => mockDeveloper),
  removeMembership: jest.fn(async () => {}),
  reinvite: jest.fn(async () => {}),
}));

describe('UserAttributes', () => {
  beforeEach(() => {
    jest.spyOn(ModalLauncher, 'open').mockImplementation(() => Promise.resolve(true));
    act(() => {
      Notification.closeAll();
    });
  });

  it('should display the list of options', () => {
    build();
    const button = screen.getByTestId('org-role-selector.button');
    fireEvent.click(button);
    const options = screen.getAllByTestId('org-role-selector.item');
    expect(options).toHaveLength(orgRoles.length);
  });

  it('should open a confirmation dialog if user is editing their own role', () => {
    build(true);
    selectRole();
    expect(updateMembership).not.toHaveBeenCalled();
    expect(ModalLauncher.open).toHaveBeenCalled();
  });

  it('should change the org role', async () => {
    build();
    selectRole();
    expect(updateMembership).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        id: mockMember.sys.id,
        role: 'developer',
      })
    );
    const notification = await screen.findByTestId('cf-ui-notification');
    expect(notification.textContent).toMatch('developer');
    expect(onRoleChangeCb).toHaveBeenCalledWith(mockDeveloper);
  });

  it('should not let non-owners change the role of an owner', () => {
    build(false, false, mockOwner);
    expect(screen.getByTestId('org-role-selector.button')).toBeDisabled();
  });

  it('should let owners change the role of another owner', () => {
    build(false, true, mockOwner);
    expect(screen.getByTestId('org-role-selector.button')).not.toBeDisabled();
  });

  it('should disable the owner role for non-owners', () => {
    build(false, false, mockMember);
    selectRole('Owner');
    expect(updateMembership).not.toHaveBeenCalled();
    expect(onRoleChangeCb).not.toHaveBeenCalled();
  });

  it('should confirm before removing the org membership', () => {
    build();
    removeUser();
    expect(removeMembership).not.toHaveBeenCalled();
    expect(ModalLauncher.open).toHaveBeenCalled();
  });

  it('should remove the org membership', async () => {
    build();
    removeUser();
    const notification = await screen.findByTestId('cf-ui-notification');
    expect(notification.textContent).toMatch('removed');
    expect(removeMembership).toHaveBeenCalledWith(expect.any(Function), mockMember.sys.id);
  });

  it('should reinvite the user', async () => {
    build(false, false, pendingMember);
    const reinviteButton = screen.getByTestId('user-attributes.reinvite-button');
    fireEvent.click(reinviteButton);

    expect(reinvite).toHaveBeenCalledWith(pendingMember);
  });

  it('should redirect to the user list after removing the member', async () => {
    build();
    removeUser();
    await screen.findByTestId('cf-ui-notification');
  });

  it('should reload the page after removing self from the org', async () => {
    delete window.location;
    window.location = { reload: jest.fn() };
    build(true);
    removeUser();
    await screen.findByTestId('cf-ui-notification');
    expect(window.location.reload).toHaveBeenCalled();
  });
});

function build(isSelf = false, isOwner = false, membership = mockMember) {
  return render(
    <MemoryRouter>
      <UserAttributes
        membership={membership}
        isSelf={isSelf}
        isOwner={isOwner}
        onRoleChange={onRoleChangeCb}
        orgId="123"
      />
    </MemoryRouter>
  );
}

function selectRole(roleName = 'Developer') {
  const button = screen.getByTestId('org-role-selector.button');
  fireEvent.click(button);
  const option = screen.getByText(roleName);
  fireEvent.click(option);
}

function removeUser() {
  const removeButton = screen.getByTestId('user-attributes.remove-button');
  fireEvent.click(removeButton);
}
