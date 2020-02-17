import React from 'react';
import { render, screen, wait, fireEvent, within } from '@testing-library/react';
import UserDetails from './UserDetails';

import * as fake from 'testHelpers/fakeFactory';
import ModalLauncher from '__mocks__/app/common/ModalLauncher';

const membershipUser = fake.User({ firstName: 'John', lastName: 'Doe' });
const createdByUser = fake.User({ firstName: 'Jane', lastName: 'Smith' });

const mockOrgMembership = fake.OrganizationMembership('member', 'active', membershipUser);
mockOrgMembership.sys.createdBy = createdByUser;
mockOrgMembership.sys.createdAt = new Date(2019, 11, 1).toISOString();
mockOrgMembership.sys.lastActiveAt = new Date(2019, 11, 25).toISOString();

const pendingMembership = fake.OrganizationMembership('member', 'pending', membershipUser);
pendingMembership.sys.createdBy = createdByUser;
pendingMembership.sys.createdAt = new Date(2019, 11, 1).toISOString();
pendingMembership.sys.lastActiveAt = null;

const mockSpaces = [
  fake.Space('Pizza Space'),
  fake.Space('Burger Space'),
  fake.Space('Ramen Space')
];

const mockTeams = [fake.Team('Hejo'), fake.Team('Moi'), fake.Team('Ahoy')];

const mockSpaceMemberships = [
  fake.SpaceMembership(fake.Link('Space', mockSpaces[0].sys.id), membershipUser),
  fake.SpaceMembership(fake.Link('Space', mockSpaces[0].sys.id), membershipUser),
  fake.SpaceMembership(fake.Link('Space', mockSpaces[0].sys.id), membershipUser)
];

const mockTeamMemberships = [
  fake.TeamMembership(fake.Link('Team', mockTeams[0].sys.id), mockOrgMembership, membershipUser),
  fake.TeamMembership(fake.Link('Team', mockTeams[0].sys.id), mockOrgMembership, membershipUser),
  fake.TeamMembership(fake.Link('Team', mockTeams[0].sys.id), mockOrgMembership, membershipUser)
];

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getSpaceMemberships: jest.fn(async () => ({
    includes: { Space: mockSpaces },
    items: mockSpaceMemberships
  }))
}));

jest.mock('access_control/TeamRepository', () => ({
  getAllTeamMemberships: jest.fn(async () => ({
    includes: { Team: mockTeams },
    items: mockTeamMemberships
  }))
}));

describe('User Details', () => {
  beforeEach(() => {});

  describe('basic user information', () => {
    describe('active and pending members', () => {
      it('should display the user name and email', async () => {
        await build();
        expect(screen.getByTestId('user-card.name').textContent).toBe('John Doe');
        expect(screen.getByTestId('user-card.email').textContent).toBe(membershipUser.email);
      });

      it('should display user attributes', async () => {
        await build();
        expect(screen.getByTestId('user-attributes.member-since').textContent).toEqual(
          'December 01, 2019'
        );
        expect(screen.getByTestId('user-attributes.invited-by').textContent).toEqual('Jane Smith');
        // Not testing for precise string since we use relative dates from moment
        expect(screen.getByTestId('user-attributes.last-active-at').textContent).toEqual(
          expect.stringContaining('ago')
        );
      });

      it('should display the org role', async () => {
        await build();
        expect(screen.getByTestId('org-role-selector.button').textContent).toEqual('Member');
      });
    });

    describe('pending member', () => {
      it('should display user attributes', async () => {
        await build({ initialMembership: pendingMembership });
        expect(screen.getByTestId('user-attributes.last-active-at').textContent).toEqual('Never');
      });

      it('should display the pending status tag', async () => {
        await build({ initialMembership: pendingMembership });
        expect(screen.getByTestId('user-card.status').textContent).toEqual('Invited');
      });
    });
  });

  describe('removing the membership', () => {
    it('should display a button to remove the user', async () => {
      await build({ initialMembership: pendingMembership });
      const removeButton = screen.getByTestId('user-attributes.remove-button');
      expect(removeButton).toBeVisible();
    });
  });

  describe('spaces', () => {
    beforeEach(async () => build());

    it('should display the list of spaces', () => {
      const items = screen.getAllByTestId('user-space-list.item');
      expect(items).toHaveLength(3);
    });

    it('should resolve the space name', () => {
      const items = screen.getAllByTestId('user-space-list.item')[0];
      const cell = within(items).queryByText('Pizza Space');
      expect(cell).toBeVisible();
    });

    it('should display the Add to Spaces modal', () => {
      const button = screen.getByTestId('user-details.add-to-space-button');
      fireEvent.click(button);
      expect(ModalLauncher.open).toHaveBeenCalled();
    });

    it('should display the Edit modal', () => {
      const dropdownButton = screen.getAllByTestId('user-space-list.menu.trigger')[0];
      fireEvent.click(dropdownButton);
      const menuItemButton = screen.getByTestId('user-space-list.menu.edit').firstElementChild;
      fireEvent.click(menuItemButton);
      expect(ModalLauncher.open).toHaveBeenCalled();
    });
  });

  describe('teams', () => {
    beforeEach(async () => {
      await build();
      selectTeamsTab();
    });

    it('should display the list of spaces', () => {
      const items = screen.getAllByTestId('user-team-list.item');
      expect(items).toHaveLength(3);
    });

    it('should resolve the team name', () => {
      const items = screen.getAllByTestId('user-team-list.item')[0];
      const cell = within(items).queryByText('Hejo');
      expect(cell).toBeVisible();
    });
  });
});

function build(options = { initialMembership: mockOrgMembership }) {
  render(
    <UserDetails
      initialMembership={options.initialMembership}
      isSelf={false}
      isOwner={false}
      orgId="org-id"
      hasTeamsFeature={true}
    />
  );

  // the component makes requests on mount.
  // wait until there are changes as effect of the calls.
  return wait();
}

function selectTeamsTab() {
  fireEvent.click(screen.getByText('Teams'));
}
