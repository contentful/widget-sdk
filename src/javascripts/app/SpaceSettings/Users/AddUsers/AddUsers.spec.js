import React from 'react';
import AddUsers from './AddUsers';
import * as fakeFactory from 'testHelpers/fakeFactory';
import userEvent from '@testing-library/user-event';
import {
  render,
  screen,
  waitForElementToBeRemoved,
  waitForElement,
  within
} from '@testing-library/react';
import * as spaceContextMocked from 'ng/spaceContext';
import { ADMIN_ROLE_ID } from 'access_control/constants';
import { getAllMembershipsWithQuery } from 'access_control/OrganizationMembershipRepository';
import { mockEndpoint } from '__mocks__/data/EndpointFactory';

const onCloseFn = jest.fn();

const grant = fakeFactory.User({
  firstName: 'Grant',
  lastName: 'Sauer',
  email: 'grant@example.com'
});
const victoria = fakeFactory.User({
  firstName: 'Victoria',
  lastName: 'Beleuta',
  email: 'victoria@example.com'
});
const patrycja = fakeFactory.User({
  firstName: 'Patrycja',
  lastName: 'Radaczyńska',
  email: 'patrycja@example.com'
});

const mockOrgMemberships = [
  fakeFactory.OrganizationMembership('member', 'active', grant),
  fakeFactory.OrganizationMembership('member', 'active', victoria),
  fakeFactory.OrganizationMembership('member', 'active', patrycja)
];

const editorRole = fakeFactory.Role('Editor');
const authorRole = fakeFactory.Role('Author');
const mockSpaceRoles = [editorRole, authorRole];

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllMembershipsWithQuery: jest.fn(async () => ({ items: mockOrgMemberships }))
}));
jest.mock('access_control/RoleRepository', () => ({
  getInstance: () => ({
    getAll: jest.fn(async () => mockSpaceRoles)
  })
}));

describe('AddUsers', () => {
  it('requests organization memberships with users', async () => {
    await build();
    expect(getAllMembershipsWithQuery).toHaveBeenCalledTimes(1);
    expect(getAllMembershipsWithQuery).toHaveBeenCalledWith(
      mockEndpoint,
      expect.objectContaining({ include: ['sys.user'] })
    );
  });

  it('renders the users', async () => {
    await build();
    expect(screen.getByText(grant.email)).toBeInTheDocument();
    expect(screen.getByText(victoria.email)).toBeInTheDocument();
    expect(screen.getByText(patrycja.email)).toBeInTheDocument();
  });

  it('does not display unavailable users', async () => {
    const unavailable = [grant.sys.id];
    await build(unavailable);
    expect(screen.queryByText(grant.email)).not.toBeInTheDocument();
    expect(screen.getByText(victoria.email)).toBeInTheDocument();
    expect(screen.getByText(patrycja.email)).toBeInTheDocument();
  });

  describe('user search', () => {
    let searchInput;

    beforeEach(async () => {
      await build();
      searchInput = screen.getByLabelText('Select users');
    });

    it('filters users by name', async () => {
      userEvent.type(searchInput, 'victoria');
      expect(screen.getByText(victoria.email)).toBeInTheDocument();
      expect(screen.queryByText(grant.email)).not.toBeInTheDocument();
      expect(screen.queryByText(patrycja.email)).not.toBeInTheDocument();
    });

    it('filters users by partial attributes', async () => {
      userEvent.type(searchInput, 'vic');
      expect(screen.getByText(victoria.email)).toBeInTheDocument();
      expect(screen.queryByText(grant.email)).not.toBeInTheDocument();
      expect(screen.queryByText(patrycja.email)).not.toBeInTheDocument();
    });

    it('filters ignoring special characters', async () => {
      userEvent.type(searchInput, 'radaczynska');
      expect(screen.getByText(patrycja.email)).toBeInTheDocument();
      expect(screen.queryByText(victoria.email)).not.toBeInTheDocument();
      expect(screen.queryByText(grant.email)).not.toBeInTheDocument();
    });

    it('filters users by email', async () => {
      userEvent.type(searchInput, 'grant@example');
      expect(screen.getByText(grant.email)).toBeInTheDocument();
      expect(screen.queryByText(victoria.email)).not.toBeInTheDocument();
      expect(screen.queryByText(patrycja.email)).not.toBeInTheDocument();
    });

    it('filters users by a combination of first and last name', async () => {
      userEvent.type(searchInput, 'victoria beleuta');
      expect(screen.getByText(victoria.email)).toBeInTheDocument();
      expect(screen.queryByText(grant.email)).not.toBeInTheDocument();
      expect(screen.queryByText(patrycja.email)).not.toBeInTheDocument();
    });
  });

  it('marks users as selected', async () => {
    await build();
    const submitButton = screen.getByTestId('add-users.user-selection.submit-button');
    expect(submitButton).toBeDisabled();

    const userOption = screen.getByText(patrycja.email);
    userEvent.click(userOption);
    expect(userOption.closest('[role=option]')).toHaveAttribute('aria-selected', 'true');
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveTextContent('Assign roles to selected users (1)');

    const userOption2 = screen.getByText(victoria.email);
    userEvent.click(userOption2);
    expect(userOption2.closest('[role=option]')).toHaveAttribute('aria-selected', 'true');
    expect(submitButton).toHaveTextContent('Assign roles to selected users (2)');

    userEvent.click(userOption);
    expect(userOption.closest('[role=option]')).toHaveAttribute('aria-selected', 'false');
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveTextContent('Assign roles to selected users (1)');

    userEvent.click(userOption2);
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Assign roles to selected users');
  });

  it('should close the modal on click on cancel button', async () => {
    await build();

    const cancelButton = screen.getByTestId('add-users.user-selection.cancel-button');
    userEvent.click(cancelButton);

    expect(onCloseFn).toHaveBeenCalled();
  });

  describe('role selection', () => {
    beforeEach(async () => {
      await build();

      userEvent.click(screen.getByText(patrycja.email));
      userEvent.click(screen.getByText(victoria.email));
      userEvent.click(screen.getByTestId('add-users.user-selection.submit-button'));
      await waitForElement(() => screen.getByText('Assign roles to selected users'));
    });

    it('shows only selected users in the role selection step', async () => {
      expect(screen.getByText(victoria.email)).toBeInTheDocument();
      expect(screen.getByText(patrycja.email)).toBeInTheDocument();
      expect(screen.queryByText(grant.email)).not.toBeInTheDocument();
    });

    it('dismisses the form on Cancel button click', () => {
      userEvent.click(screen.getByTestId('add-users.role-selection.cancel-button'));
      expect(onCloseFn).toHaveBeenCalled();
    });

    it('goes back to the user selection step', async () => {
      userEvent.click(screen.getByText('Edit selection'));

      expect(screen.queryByText('Assign roles to selected users')).not.toBeInTheDocument();

      // TODO: the loading state should not come back! Fix the actual bug instead of testing it
      await waitForElementToBeRemoved(() => screen.getByTestId('add-users.user-list.skeleton'));

      const user1 = screen.getByText(victoria.email);
      const user2 = screen.getByText(patrycja.email);
      const user3 = screen.getByText(grant.email);

      expect(user1).toBeInTheDocument();
      expect(user2).toBeInTheDocument();
      expect(user3).toBeInTheDocument();

      expect(user1.closest('[role=option]')).toHaveAttribute('aria-selected', 'true');
      expect(user2.closest('[role=option]')).toHaveAttribute('aria-selected', 'true');
      expect(user3.closest('[role=option]')).toHaveAttribute('aria-selected', 'false');
    });

    it('displays an error if no roles selected when trying to submit', () => {
      const submitButton = screen.getByTestId('add-users.role-selection.submit-button');
      userEvent.click(submitButton);
      expect(screen.getByTestId('add-users.role-selection.error-note')).toBeInTheDocument();
      assignRole(victoria.email, 'Editor');
      userEvent.click(submitButton);
      expect(screen.getByTestId('add-users.role-selection.error-note')).toBeInTheDocument();
      assignRole(patrycja.email, 'Author');
    });

    it('submits successfully', async () => {
      const submitButton = screen.getByTestId('add-users.role-selection.submit-button');

      assignRole(patrycja.email, 'Editor');
      assignRole(victoria.email, 'Admin');

      userEvent.click(submitButton);
      expect(screen.queryByTestId('add-users.role-selection.error-note')).not.toBeInTheDocument();
      expect(spaceContextMocked.memberships.invite).toHaveBeenCalledTimes(2);
      expect(spaceContextMocked.memberships.invite.mock.calls).toEqual([
        [patrycja.email, [editorRole.sys.id]],
        [victoria.email, [ADMIN_ROLE_ID]]
      ]);

      await waitForElement(() => screen.getByText('Invitations successfully sent.'));
    });
  });

  describe('when invitations fail', () => {
    beforeEach(async () => {
      spaceContextMocked.memberships.invite
        // Grant - taken / already a member
        .mockRejectedValueOnce(createError(true))
        // Victoria - server error
        .mockRejectedValueOnce(createError())
        // Patrycja - server error
        .mockRejectedValueOnce(createError());

      await build();

      userEvent.click(screen.getByText(grant.email));
      userEvent.click(screen.getByText(victoria.email));
      userEvent.click(screen.getByText(patrycja.email));

      userEvent.click(screen.getByTestId('add-users.user-selection.submit-button'));

      assignRole(grant.email, 'Admin');
      assignRole(victoria.email, 'Author');
      assignRole(patrycja.email, 'Editor');

      userEvent.click(screen.getByTestId('add-users.role-selection.submit-button'));

      await waitForElement(() => screen.getByText(/something went wrong/));
    });

    it('lists users who unexpectedly failed to be invited and leave out expected failures', async () => {
      expect(screen.queryByText('Grant Sauer')).not.toBeInTheDocument();
      expect(screen.getByText('Victoria Beleuta')).toBeInTheDocument();
      expect(screen.getByText('Patrycja Radaczyńska')).toBeInTheDocument();
    });

    it('goes back to role selection if Retry is clicked and lists only pending users', async () => {
      userEvent.click(screen.getByTestId('add-users.error-state.retry-button'));
      await waitForElement(() => screen.getByText('Assign roles to selected users'));

      expect(screen.queryByText('Grant Sauer')).not.toBeInTheDocument();
      expect(screen.getByText('Victoria Beleuta')).toBeInTheDocument();
      expect(screen.getByText('Patrycja Radaczyńska')).toBeInTheDocument();
    });

    it('closes the modal if Cancel is clicked', () => {
      userEvent.click(screen.getByTestId('add-users.error-state.cancel-button'));
      expect(onCloseFn).toHaveBeenCalled();
    });
  });
});

async function build(unavailableUserIds = []) {
  render(
    <AddUsers
      unavailableUserIds={unavailableUserIds}
      orgId="123"
      isShown={true}
      onClose={onCloseFn}
    />
  );
  await waitForElementToBeRemoved(() => screen.getByTestId('add-users.user-list.skeleton'));
}

function assignRole(userEmail, roleName) {
  const userOption = screen
    .getByText(userEmail)
    .closest('[data-test-id="add-users.role-selection.user-option"]');
  const roleEditorDropdownTrigger = within(userOption).getByTestId('space-role-editor.button');

  userEvent.click(roleEditorDropdownTrigger);
  userEvent.click(screen.getByText(roleName));
}

function createError(taken = false) {
  const error = Error('Something went wrong');

  if (taken) {
    error.statusCode = error.status = 422;
    error.data = { details: { errors: [{ name: 'taken' }] } };
  } else {
    error.statusCode = error.status = 500;
  }

  return error;
}
