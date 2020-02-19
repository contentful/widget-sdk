import React from 'react';
import { render, screen, wait, fireEvent } from '@testing-library/react';
import UserListRow from './UserListRow';

import * as fake from 'testHelpers/fakeFactory';
import * as FORMA_CONSTANTS from 'testHelpers/Forma36Constants';

const openRoleChangeDialog = jest.fn();
const openRemovalConfirmationDialog = jest.fn();

const defaultUser = fake.User({ firstName: 'John', lastName: 'Doe', activated: true });
const nonActivedUser = fake.User({ firstName: 'John', lastName: 'Doe', activated: false });
const defaultSpace = fake.Link('Space');
const defaultSpaceMembership = fake.SpaceMembership(defaultSpace, defaultUser);

const FakeSpaceRoleOne = fake.SpaceRole('Role 1');
const FakeSpaceRoleTwo = fake.SpaceRole('Role 2');
const oneRoleSpaceMembership = fake.SpaceMembership(defaultSpace, defaultUser, false, [
  FakeSpaceRoleOne
]);
const twoRoleSpaceMembership = fake.SpaceMembership(defaultSpace, defaultUser, false, [
  FakeSpaceRoleOne,
  FakeSpaceRoleTwo
]);

const defaultOptions = {
  member: defaultSpaceMembership,
  canModifyUsers: false,
  openRoleChangeDialog: jest.fn(),
  openRemovalConfirmationDialog: jest.fn(),
  numberOfTeamMemberships: { 'random id': 4 },
  adminCount: 1
};

describe('User List Row', () => {
  describe('renders correctly', () => {
    it('The User Avatar renders', async () => {
      await build();

      const imgTag = screen.getByTestId('user-list.avatar');
      const imageSourceWithOutHttps = imgTag.src.split('/').pop();

      expect(imageSourceWithOutHttps).toEqual('avatar.jpg');
      expect(imgTag.alt).toEqual('user avatar');
      expect(imgTag.width).toEqual(50);
      expect(imgTag.height).toEqual(50);
    });

    it('The display name is correct', async () => {
      await build();

      expect(screen.getByTestId('user-list.name')).toHaveTextContent('John Doe');
    });

    it('Displays correctly if the account is activated', async () => {
      await build();

      expect(() => {
        screen.getByTestId('user-list.not-confirmed');
      }).toThrow();
    });

    it('Displays correctly if the account is not activated', async () => {
      buildWithNonActivedUser();

      expect(screen.getByTestId('user-list.not-confirmed')).toHaveTextContent(
        'This account is not confirmed'
      );
    });

    describe('Displays users role(s) correctly', () => {
      it('Displays Admin role correctly', async () => {
        await build();

        expect(screen.getByTestId('user-list.roles')).toHaveTextContent('Administrator');
      });

      it('Displays User with one role correctly', async () => {
        buildWithOneRoleUser();

        expect(screen.getByTestId('user-list.roles')).toHaveTextContent('Role 1');
      });

      it('Displays User with more than one role correctly', async () => {
        buildWithTwoRoleUser();

        expect(screen.getByTestId('user-list.roles')).toHaveTextContent('Role 1 and Role 2');
      });
    });

    describe('Edit user dropdown', () => {
      it('is disabled if the user cannot modify users', async () => {
        await build();

        expect(screen.getByTestId('user-list.actions').hasAttribute('disabled')).toBeTruthy();
      });

      it('drops down when clicked', async () => {
        buildWithCanModifyUser();
        fireEvent.click(screen.getByTestId('user-list.actions'));

        expect(screen.getByTestId('user-change-role')).toBeDefined();
      });

      it('it calls openRoleChangeDialog when that is clicked', async () => {
        buildWithCanModifyUser();
        fireEvent.click(screen.getByTestId('user-list.actions'));

        const editUserRoleButtonContainer = screen.getByTestId('user-change-role');
        fireEvent.click(
          editUserRoleButtonContainer.querySelector(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
        );

        expect(openRoleChangeDialog).toHaveBeenCalled();
      });
      it('it calls openRemovalConfirmationDialog when that is clicked', async () => {
        buildWithCanModifyUser();
        fireEvent.click(screen.getByTestId('user-list.actions'));

        const editUserRoleButtonContainer = screen.getByTestId('user-remove-from-space');
        fireEvent.click(
          editUserRoleButtonContainer.querySelector(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
        );

        expect(openRemovalConfirmationDialog).toHaveBeenCalled();
      });
    });
  });
});

async function buildWithNonActivedUser() {
  const updatedOptions = Object.assign({}, defaultOptions);

  updatedOptions.member = fake.SpaceMembership(defaultSpace, nonActivedUser);

  await build(updatedOptions);
}

async function buildWithOneRoleUser() {
  const updatedOptions = Object.assign({}, defaultOptions);

  updatedOptions.member = oneRoleSpaceMembership;

  await build(updatedOptions);
}

async function buildWithTwoRoleUser() {
  const updatedOptions = Object.assign({}, defaultOptions);

  updatedOptions.member = twoRoleSpaceMembership;

  await build(updatedOptions);
}

async function buildWithCanModifyUser() {
  const updatedOptions = Object.assign({}, defaultOptions);

  updatedOptions.canModifyUsers = true;

  await build(updatedOptions);
}

function build(options = defaultOptions) {
  render(
    <UserListRow
      member={options.member}
      canModifyUsers={options.canModifyUsers}
      openRoleChangeDialog={openRoleChangeDialog}
      openRemovalConfirmationDialog={openRemovalConfirmationDialog}
      numberOfTeamMemberships={options.numberOfTeamMemberships}
      adminCount={options.adminCount}
    />
  );

  // the component makes requests on mount.
  // wait until there are changes as effect of the calls.
  return wait();
}
