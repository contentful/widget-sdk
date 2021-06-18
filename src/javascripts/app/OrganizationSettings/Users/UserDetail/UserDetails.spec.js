import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import UserDetails from './UserDetails';
import { MemoryRouter } from 'core/react-routing';

import * as fake from 'test/helpers/fakeFactory';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import { getAllSpaceMemberships } from 'access_control/OrganizationMembershipRepository';
import { getAllTeamMemberships, removeTeamMembership } from 'access_control/TeamRepository';

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

const pizzaSpace = fake.Space();
const mockSpaces = [pizzaSpace, fake.Space(), fake.Space()];

const teamHejo = fake.Team('Hejo');
const mockTeams = [teamHejo, fake.Team('Moi'), fake.Team('Ahoy')];

const mockSpaceMemberships = mockSpaces.map((space) =>
  fake.SpaceMembership(fake.Link('Space', space.sys.id), membershipUser)
);

const mockTeamMemberships = mockTeams.map((team) =>
  fake.TeamMembership(fake.Link('Team', team.sys.id), mockOrgMembership, membershipUser)
);

const mockNavigate = jest.fn();
jest.mock('core/react-routing/useRouteNavigate', () => ({ useRouteNavigate: () => mockNavigate }));

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllSpaceMemberships: jest.fn(async () => ({
    includes: { Space: mockSpaces },
    items: mockSpaceMemberships,
  })),
}));

jest.mock('access_control/TeamRepository', () => ({
  getAllTeamMemberships: jest.fn(async () => ({
    includes: { Team: mockTeams },
    items: mockTeamMemberships,
  })),
  removeTeamMembership: jest.fn(() => Promise.resolve()),
}));

describe('User Details', () => {
  beforeEach(() => {
    jest.spyOn(ModalLauncher, 'open').mockImplementation(() => Promise.resolve(true));
  });

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
      const cell = within(items).queryByText(pizzaSpace.name);
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

    it('should display the Add to Teams modal', () => {
      const button = screen.getByTestId('user-details.add-to-teams-button');
      fireEvent.click(button);
      expect(ModalLauncher.open).toHaveBeenCalled();
    });

    it('removes from a team', async () => {
      // Get the table row containing that specific team name
      const membershipRow = screen
        .queryByText('Hejo')
        .closest('[data-test-id="user-team-list.item"]');
      const dropdownButton = within(membershipRow).getByTestId('user-team-list.menu.trigger');
      fireEvent.click(dropdownButton);
      const menuItemButton = screen.getByTestId('user-team-list.menu.remove').firstElementChild;
      fireEvent.click(menuItemButton);
      expect(removeTeamMembership).toHaveBeenCalled();
      // assert that the membership is removed from the list
      await waitForElementToBeRemoved(() => screen.queryByText('Hejo'));
    });
  });
});

describe('back button', () => {
  let button;

  jest.spyOn(window.history, 'back');

  beforeEach(async () => {
    delete window.location;
    window.location = { host: 'localhost:3001' };
    await build();
    button = screen.getByTestId('workbench-back-btn');
  });

  it('navigates back in history when the last visited page was in the webapp', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'http://localhost:3001/some-page',
      writable: true,
    });

    button.click();

    expect(window.history.back).toHaveBeenCalled();
  });

  it('navigates to the user list if the referrer is unknown', () => {
    Object.defineProperty(document, 'referrer', { value: '', writable: true });

    button.click();

    expect(window.history.back).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenLastCalledWith({
      path: 'organizations.users.list',
      orgId: 'org-id',
    });
  });
});

function build(options = { initialMembership: mockOrgMembership }) {
  render(
    <MemoryRouter>
      <UserDetails
        initialMembership={options.initialMembership}
        isSelf={false}
        isOwner={false}
        orgId="org-id"
        hasTeamsFeature={true}
      />
    </MemoryRouter>
  );

  // the component makes requests on mount.
  // wait until there are changes as effect of the calls.
  return waitFor(() => {
    expect(getAllSpaceMemberships).toHaveBeenCalled();
    expect(getAllTeamMemberships).toHaveBeenCalled();
  });
}

function selectTeamsTab() {
  fireEvent.click(screen.getByText('Teams'));
}
