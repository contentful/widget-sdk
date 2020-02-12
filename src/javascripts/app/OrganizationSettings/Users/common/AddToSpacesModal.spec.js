import React from 'react';
import { render, fireEvent, within, wait, screen } from '@testing-library/react';

import '@testing-library/jest-dom/extend-expect';
import AddToSpacesModal from './AddToSpacesModal';
import * as fake from 'testHelpers/fakeFactory';

const fooSpace = fake.Space('Foo');
const barSpace = fake.Space('Bar');
const mockSpaces = [fooSpace, barSpace];
const editorRole = fake.Role('Editor', fooSpace);
const authorRole = fake.Role('Author', barSpace);
const mockRoles = [editorRole, authorRole];
const mockSpaceMembership = fake.SpaceMembership();
const user = fake.User();

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllSpaces: jest.fn(async () => mockSpaces),
  getAllRoles: jest.fn(async () => mockRoles)
}));

jest.mock('access_control/SpaceMembershipRepository', () => ({
  create: () => ({
    invite: jest.fn(async () => mockSpaceMembership)
  })
}));

const onCloseCb = jest.fn();
const onAddedToSpacesCb = jest.fn();

describe('AddToSpacesModal', () => {
  it('should should display a list of space options', async () => {
    await build();
    const input = screen.getByTestId('autocomplete.input');
    fireEvent.focus(input);
    await screen.findAllByTestId('autocomplete.dropdown-list-item');

    mockSpaces.forEach(space => {
      const option = screen.getByText(space.name);
      expect(option).toBeVisible();
    });
  });

  it('should should not display unavailable spaces', async () => {
    const unavailable = fooSpace;
    const available = barSpace;

    await build([unavailable]);
    const input = screen.getByTestId('autocomplete.input');
    fireEvent.focus(input);
    await screen.findAllByTestId('autocomplete.dropdown-list-item');

    expect(screen.queryByText(unavailable.name)).toBeNull();
    expect(screen.queryByText(available.name)).toBeVisible();
  });

  it('should create space memberships', async () => {
    await build();
    const membershipPlans = [
      { spaceName: fooSpace.name, roleNames: [editorRole.name] },
      { spaceName: barSpace.name, roleNames: [authorRole.name] }
    ];
    await setupMemberships(membershipPlans);
    // wait for notification to pop up
    await screen.findAllByTestId('cf-ui-notification');
    expect(onAddedToSpacesCb).toHaveBeenCalled();
  });
});

function build(currentSpaces = []) {
  render(
    <AddToSpacesModal
      user={user}
      orgId="org1"
      currentSpaces={currentSpaces}
      isShown={true}
      onClose={onCloseCb}
      onAddedToSpaces={onAddedToSpacesCb}
    />
  );
  // the component automatically fetches roles.
  // we have to wait until it's happened
  return wait();
}

async function setupMemberships(membershipPlans = [{ spaceName: '', roleNames: [] }]) {
  // focus on autocomplete and wait for options to show up
  const input = screen.getByTestId('autocomplete.input');
  fireEvent.focus(input);
  await screen.findAllByTestId('autocomplete.dropdown-list-item');

  // select spaces in thr autocomplete
  membershipPlans.forEach(({ spaceName }) => {
    fireEvent.focus(input);
    const space = screen.queryByText(spaceName);
    fireEvent.click(space);
  });

  // select all roles
  await Promise.all(
    membershipPlans.map(async ({ roleNames }, index) => {
      const membershipListItem = screen.getAllByTestId('add-to-spaces.list.item')[index];
      await Promise.all(
        roleNames.map(async roleName => {
          const rolesDropdownTrigger = within(membershipListItem).getByTestId(
            'space-role-editor.button'
          );
          fireEvent.click(rolesDropdownTrigger);
          await screen.findAllByTestId('space-role-editor.options');
          const role = screen.getByLabelText(roleName);
          fireEvent.click(role);
        })
      );
    })
  );

  // submit form
  const submitButton = screen.getByTestId('add-to-spaces.modal.submit-button');
  fireEvent.click(submitButton);
}
