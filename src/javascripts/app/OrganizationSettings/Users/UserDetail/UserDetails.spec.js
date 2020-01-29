import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import UserDetails from './UserDetails';

const membershipUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@enterprise.com',
  avatarUrl: 'http://avatar.jpg',
  sys: { id: 'org-user-john' }
};
const createdByUser = {
  firstName: 'Creator',
  lastName: 'User',
  avatarUrl: 'http://avatar.jpg',
  sys: { id: 'org-user-creator' }
};
const mockOrgMembership = {
  role: 'member',
  status: 'active',
  sys: {
    id: 'membership-id',
    user: membershipUser,
    createdBy: createdByUser,
    createdAt: new Date(2019, 11, 1).toISOString(),
    lastActiveAt: new Date(2019, 11, 25).toISOString()
  }
};

const pendingMembership = {
  role: 'owner',
  status: 'pending',
  sys: {
    id: 'membership-id',
    user: membershipUser,
    createdBy: createdByUser,
    createdAt: new Date(2019, 11, 1).toISOString(),
    lastActiveAt: null
  }
};

describe('User Details', () => {
  describe('basic user information', () => {
    describe('active and pending members', () => {
      it('should display the user name and email', () => {
        const { getByTestId } = build();
        expect(getByTestId('user-card.name').textContent).toBe('John Doe');
        expect(getByTestId('user-card.email').textContent).toBe('john.doe@enterprise.com');
      });

      it('should display user attributes', () => {
        const { getByTestId } = build();
        expect(getByTestId('user-attributes.member-since').textContent).toEqual(
          'December 01, 2019'
        );
        expect(getByTestId('user-attributes.invited-by').textContent).toEqual('Creator User');
        // Not testing for precise string since we use relative dates from moment
        expect(getByTestId('user-attributes.last-active-at').textContent).toEqual(
          expect.stringContaining('ago')
        );
      });

      it('should display the org role', () => {
        const { getByTestId } = build();
        expect(getByTestId('org-role-selector.button').textContent).toEqual('Member');
      });
    });

    describe('pending member', () => {
      it('should display user attributes', () => {
        const { getByTestId } = build({ initialMembership: pendingMembership });
        expect(getByTestId('user-attributes.last-active-at').textContent).toEqual('Never');
      });

      it('should display the pending status tag', () => {
        const { getByTestId } = build({ initialMembership: pendingMembership });
        expect(getByTestId('user-card.status').textContent).toEqual('Invited');
      });
    });
  });

  describe('removing the membership', () => {
    it('should open a confirmation dialog before removing the member', () => {
      const { getByTestId } = build({ initialMembership: pendingMembership });
      const removeButton = getByTestId('user-attributes.remove-button');
      fireEvent.click(removeButton);
      const dialog = getByTestId('remove-org-membership-dialog');
      expect(dialog).toBeVisible();
    });
  });
});

function build(options = { initialMembership: mockOrgMembership }) {
  return render(
    <UserDetails
      initialMembership={options.initialMembership}
      isSelf={false}
      orgId="org-id"
      hasTeamsFeature={true}
    />
  );
}
