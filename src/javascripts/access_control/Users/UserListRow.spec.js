import React from 'react';
import { render, screen, wait, fireEvent, within } from '@testing-library/react';
import UserListRow from './UserListRow';

import * as fake from 'test/helpers/fakeFactory';
import * as FORMA_CONSTANTS from 'test/helpers/Forma36Constants';

describe('User List Row', () => {
  const openRoleChangeDialog = jest.fn();
  const openRemovalConfirmationDialog = jest.fn();

  const defaultUser = fake.User();
  const nonActivedUser = fake.User({ activated: false });
  const defaultSpace = fake.Link('Space');
  const defaultSpaceMembership = fake.SpaceMembership(defaultSpace, defaultUser);
  const nonActivedUserSpaceMembership = fake.SpaceMembership(defaultSpace, nonActivedUser);

  const fakeSpaceRoleOne = fake.SpaceRole('Role 1');
  const fakeSpaceRoleTwo = fake.SpaceRole('Role 2');
  const oneRoleSpaceMembership = fake.SpaceMembership(defaultSpace, defaultUser, false, [
    fakeSpaceRoleOne
  ]);
  const twoRoleSpaceMembership = fake.SpaceMembership(defaultSpace, defaultUser, false, [
    fakeSpaceRoleOne,
    fakeSpaceRoleTwo
  ]);

  const build = custom => {
    const props = Object.assign(
      {
        member: defaultSpaceMembership,
        canModifyUsers: false,
        openRoleChangeDialog: openRoleChangeDialog,
        openRemovalConfirmationDialog: openRemovalConfirmationDialog,
        numberOfTeamMemberships: { 'random id': 4 },
        adminCount: 1
      },
      custom
    );

    render(<UserListRow {...props} />);

    return wait();
  };

  describe('renders correctly', () => {
    it('should render the user avatar properly', async () => {
      await build();

      const imgTag = screen.getByTestId('user-list.avatar');
      const imageSourceWithOutHttps = imgTag.src.split('/').pop();

      expect(imageSourceWithOutHttps).toEqual('avatar.jpg');
      expect(imgTag.alt).toEqual('user avatar');
      expect(imgTag.width).toEqual(50);
      expect(imgTag.height).toEqual(50);
    });

    it('should display the name correctly', async () => {
      await build();

      expect(screen.getByTestId('user-list.name')).toHaveTextContent('John Doe');
    });

    it('should correctly display if the account is activated', async () => {
      await build();

      expect(screen.queryByTestId('user-list.not-confirmed')).not.toBeInTheDocument();
    });

    it('should correctly display if the account is not activated', async () => {
      await build({ member: nonActivedUserSpaceMembership });

      expect(screen.getByTestId('user-list.not-confirmed')).toHaveTextContent(
        'This account is not confirmed'
      );
    });

    describe('Displays users role(s) correctly', () => {
      it('should display admin role correctly', async () => {
        await build();

        expect(screen.getByTestId('user-list.roles')).toHaveTextContent('Administrator');
      });

      it('should display a user with one role correctly', async () => {
        await build({ member: oneRoleSpaceMembership });

        expect(screen.getByTestId('user-list.roles')).toHaveTextContent('Role 1');
      });

      it('should display a user with more than one role correctly', async () => {
        await build({ member: twoRoleSpaceMembership });

        expect(screen.getByTestId('user-list.roles')).toHaveTextContent('Role 1 and Role 2');
      });
    });

    describe('Edit user dropdown', () => {
      it('should be disabled if the user cannot modify users', async () => {
        await build();

        expect(screen.getByTestId('user-list.actions').hasAttribute('disabled')).toBeTruthy();
      });

      it('should drop down when clicked', async () => {
        await build({ canModifyUsers: true });
        fireEvent.click(screen.getByTestId('user-list.actions'));

        expect(screen.getByTestId('user-change-role')).toBeDefined();
      });

      it('should call openRoleChangeDialog when that is clicked', async () => {
        await build({ canModifyUsers: true });
        fireEvent.click(screen.getByTestId('user-list.actions'));

        const editUserRoleButtonContainer = screen.getByTestId('user-change-role');
        fireEvent.click(
          within(editUserRoleButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
        );

        expect(openRoleChangeDialog).toHaveBeenCalled();
      });
      it('should call openRemovalConfirmationDialog when that is clicked', async () => {
        await build({ canModifyUsers: true });
        fireEvent.click(screen.getByTestId('user-list.actions'));

        const editUserRoleButtonContainer = screen.getByTestId('user-remove-from-space');
        fireEvent.click(
          within(editUserRoleButtonContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
        );

        expect(openRemovalConfirmationDialog).toHaveBeenCalled();
      });
    });
  });
});
