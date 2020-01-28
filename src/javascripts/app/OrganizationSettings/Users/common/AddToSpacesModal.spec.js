import React from 'react';
import { render, cleanup, waitForElement, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AddToSpacesModal from './AddToSpacesModal';

const mockRoles = [
  {
    name: 'Editor',
    sys: {
      id: 'editorid',
      space: { sys: { id: '123' } }
    }
  },
  {
    name: 'Author',
    sys: {
      id: 'authorid',
      space: { sys: { id: '456' } }
    }
  }
];
const mockSpaces = [
  {
    name: 'Foo',
    sys: { id: '123' }
  },
  {
    name: 'Bar',
    sys: { id: '456' }
  }
];

const mockSpaceMembership = {
  admin: true,
  roles: []
};

const user = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@enterprise.com',
  avatarUrl: 'avatar.jpg',
  sys: {
    id: 'xyz'
  }
};

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
  afterEach(cleanup);

  it('should should display a list of space options', async () => {
    const { getAllByTestId, getByTestId, getByText } = build();
    const input = getByTestId('autocomplete.input');
    fireEvent.focus(input);
    await waitForElement(() => getAllByTestId('autocomplete.dropdown-list-item'));

    mockSpaces.forEach(space => {
      const option = getByText(space.name);
      expect(option).toBeVisible();
    });
  });

  it('should should not display unavailable spaces', async () => {
    const unavailable = mockSpaces[0];
    const available = mockSpaces[1];

    const { getAllByTestId, getByTestId, queryByText } = build([unavailable]);
    const input = getByTestId('autocomplete.input');
    fireEvent.focus(input);
    await waitForElement(() => getAllByTestId('autocomplete.dropdown-list-item'));

    expect(queryByText(unavailable.name)).toBeNull();
    expect(queryByText(available.name)).toBeVisible();
  });

  it('should create space memberships', async () => {
    const wrapper = build();
    const membershipPlans = [
      { spaceName: 'Foo', roleNames: ['Editor'] },
      { spaceName: 'Bar', roleNames: ['Author'] }
    ];
    await setupMemberships(wrapper, membershipPlans);
    // wait for notification to pop up
    await wrapper.findAllByTestId('cf-ui-notification');
    expect(onAddedToSpacesCb).toHaveBeenCalled();
  });
});

function build(currentSpaces = []) {
  return render(
    <AddToSpacesModal
      user={user}
      orgId="org1"
      currentSpaces={currentSpaces}
      isShown={true}
      onClose={onCloseCb}
      onAddedToSpaces={onAddedToSpacesCb}
    />
  );
}

async function setupMemberships(wrapper, membershipPlans = [{ spaceName: '', roleNames: [] }]) {
  const { getAllByTestId, findAllByTestId, getByTestId, queryByText, getByLabelText } = wrapper;

  // focus on autocomplete and wait for options to show up
  const input = getByTestId('autocomplete.input');
  fireEvent.focus(input);
  await waitForElement(() => getAllByTestId('autocomplete.dropdown-list-item'));

  // select spaces in thr autocomplete
  membershipPlans.forEach(({ spaceName }) => {
    fireEvent.focus(input);
    const space = queryByText(spaceName);
    fireEvent.click(space);
  });

  // select all roles
  await Promise.all(
    membershipPlans.map(async ({ roleNames }, index) => {
      const membershipListItem = getAllByTestId('add-to-spaces.list.item')[index];
      await Promise.all(
        roleNames.map(async roleName => {
          const rolesDropdownTrigger = within(membershipListItem).getByTestId(
            'space-role-editor.button'
          );
          fireEvent.click(rolesDropdownTrigger);
          await findAllByTestId('space-role-editor.options');
          const role = getByLabelText(roleName);
          fireEvent.click(role);
        })
      );
    })
  );

  // submit form
  const submitButton = getByTestId('add-to-spaces.modal.submit-button');
  fireEvent.click(submitButton);
}
