import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';

import '@testing-library/jest-dom/extend-expect';
import { AddToSpacesModal } from './AddToSpacesModal';
import * as fake from 'test/helpers/fakeFactory';

const fooSpace = fake.Space('Foo');
const barSpace = fake.Space('Bar');
const mockSpaces = [fooSpace, barSpace];
const editorRole = fake.Role('Editor', fooSpace);
const authorRole = fake.Role('Author', barSpace);
const mockRoles = [editorRole, authorRole];
const mockTeamSpaceMembership = fake.TeamSpaceMembership();
const team = fake.Team();

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllSpaces: jest.fn(async () => mockSpaces),
  getAllRoles: jest.fn(async () => mockRoles),
}));

jest.mock('access_control/TeamRepository', () => ({
  createTeamSpaceMembership: jest.fn(async () => mockTeamSpaceMembership),
}));

const onCloseCb = jest.fn();
const onAddedToSpacesCb = jest.fn();

describe('AddToSpacesModal', () => {
  it('should should display a list of space options', async () => {
    await build();
    const input = screen.getByTestId('autocomplete.input');
    fireEvent.focus(input);
    await screen.findAllByTestId('autocomplete.dropdown-list-item');

    mockSpaces.forEach((space) => {
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

  it('should create team space memberships', async () => {
    await build();
    const membershipPlans = [
      { space: fooSpace, roleNames: [editorRole.name] },
      { space: barSpace, roleNames: [authorRole.name] },
    ];
    await setupTeamSpaceMemberships(membershipPlans);
    // wait for notification to pop up
    await screen.findAllByTestId('cf-ui-notification');
    expect(onAddedToSpacesCb).toHaveBeenCalled();
  });
});

function build(currentSpaces = []) {
  return render(
    <AddToSpacesModal
      team={team}
      orgId="org1"
      currentSpaces={currentSpaces}
      isShown={true}
      onClose={onCloseCb}
      onAddedToSpaces={onAddedToSpacesCb}
    />
  );
}

async function setupTeamSpaceMemberships(membershipPlans = [{ space: '', roleNames: [] }]) {
  // focus on autocomplete and wait for options to show up
  const input = screen.getByTestId('autocomplete.input');
  fireEvent.focus(input);
  await screen.findAllByTestId('autocomplete.dropdown-list-item');

  // select spaces in thr autocomplete
  membershipPlans.forEach(({ space }) => {
    fireEvent.change(input, { target: { value: space.sys.id } });
  });

  // submit form
  const submitButton = screen.getByTestId('add-to-spaces.modal.submit-button');
  fireEvent.click(submitButton);
}
