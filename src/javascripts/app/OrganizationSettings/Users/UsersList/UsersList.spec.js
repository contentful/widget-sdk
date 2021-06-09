import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { generateFilterDefinitions } from './FilterDefinitions';
import { UsersList } from './UsersList';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import * as fake from 'test/helpers/fakeFactory';
import cleanupNotifications from 'test/helpers/cleanupNotifications';
import {
  removeMembership,
  getMemberships,
  reinvite,
} from 'access_control/OrganizationMembershipRepository';
import { getOrganization } from 'services/TokenStore';
import { getBasePlan } from 'features/pricing-entities';
import { THRESHOLD_NUMBER_TO_DISPLAY_BANNER } from './UserLimitBanner';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'core/react-routing';

const filters = generateFilterDefinitions({ hasSsoEnabled: true });

const mockOrg = fake.Organization();

const spaceRoleOne = fake.SpaceRole('Role 1');
const spaceRoleTwo = fake.SpaceRole('Role 2');
const spaceOne = fake.Space('Space 1');
const spaceTwo = fake.Space('Space 2');

const getMockUsers = (numberOfUsers) =>
  Array.from(Array(numberOfUsers)).map((_, idx) =>
    fake.OrganizationMembership(
      'member',
      'pending',
      fake.User({
        firstName: 'James',
        lastName: `Bond ${idx}`,
        email: `james-${idx}@example.com`,
      })
    )
  );
const mockOrgMemberships = getMockUsers(3);

const mockOrgEndpoint = jest.fn();
jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn(() => mockOrgEndpoint),
}));
jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(() => mockOrg),
}));
jest.mock('account/pricing/PricingDataProvider', () => ({
  isFreePlan: jest.fn().mockReturnValue(true),
}));
jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getMemberships: jest.fn(async () => ({ items: mockOrgMemberships, total: 13 })), //mock bigger total to test pagination
  removeMembership: jest.fn(),
  reinvite: jest.fn(),
}));
jest.mock('features/pricing-entities', () => ({
  getBasePlan: jest.fn(),
}));

jest.useFakeTimers();

async function build() {
  render(
    <MemoryRouter>
      <UsersList
        orgId={mockOrg.sys.id}
        spaceRoles={[spaceRoleOne, spaceRoleTwo]}
        spaces={[spaceOne, spaceTwo]}
        teams={[]}
        hasSsoEnabled={true}
        hasTeamsFeature={false}
      />
    </MemoryRouter>
  );

  return waitFor(() =>
    expect(screen.getAllByTestId('organization-membership-list-row').length).toBeGreaterThan(0)
  );
}

describe('UsersList', () => {
  beforeEach(() => {
    jest.spyOn(ModalLauncher, 'open').mockImplementation(() => Promise.resolve(true));
  });

  afterEach(() => {
    cleanup();
    cleanupNotifications();
  });

  it('should render users list and filters', async () => {
    await build({});
    expect(screen.getAllByTestId('search-filter')).toHaveLength(filters.length);
    expect(getMemberships).toHaveBeenCalledWith(mockOrgEndpoint, {
      order: '-sys.createdAt',
      query: '',
      include: ['sys.user'],
      skip: 0,
      limit: 10,
    });
    expect(screen.getAllByTestId('organization-membership-list-row')).toHaveLength(
      mockOrgMemberships.length
    );
  });

  it('should get users with correct query when pagination changes', async () => {
    await build({});
    const query = {
      order: '-sys.createdAt',
      query: '',
      include: ['sys.user'],
      skip: 0,
      limit: 10,
    };
    const nextPageBtn = screen.getByTestId('pagination.next');
    expect(nextPageBtn).toBeVisible();
    fireEvent.click(nextPageBtn);
    expect(getMemberships).toHaveBeenCalledWith(mockOrgEndpoint, { ...query, skip: 10 });
    await screen.findAllByTestId('organization-membership-list-row');
    const prevPageBtn = screen.getByTestId('pagination.previous');
    expect(prevPageBtn).toBeVisible();
    fireEvent.click(prevPageBtn);
    expect(getMemberships).toHaveBeenCalledWith(mockOrgEndpoint, query);
    await screen.findAllByTestId('organization-membership-list-row');
  });

  it('should successfully remove user', async () => {
    await build();
    const dropdown = screen.getAllByTestId('userlist.row.actions')[0];
    userEvent.click(dropdown);
    const removeBtn = screen.getByTestId('userlist.row.actions.remove').querySelector('button');
    userEvent.click(removeBtn);

    await waitFor(() => expect(ModalLauncher.open).toHaveBeenCalled());

    expect(removeMembership).toHaveBeenCalled();
    expect(screen.getAllByTestId('organization-membership-list-row')).toHaveLength(
      mockOrgMemberships.length - 1
    );
    await waitFor(() => screen.getByTestId('cf-ui-notification'));
  });

  it('should successfully reinvite user', async () => {
    await build();
    const dropdown = screen.getAllByTestId('userlist.row.actions')[0];
    userEvent.click(dropdown);
    const reinviteBtn = screen.getByTestId('userlist.row.actions.reinvite').querySelector('button');
    userEvent.click(reinviteBtn);

    expect(reinvite).toHaveBeenCalledWith(mockOrgMemberships[0]);
  });

  describe('show UsersLimitBanner', () => {
    it('should not show it', async () => {
      await build();

      expect(screen.queryByTestId('users-limit-banner')).toBeNull();
    });

    it('should show it when the user is in a Free plan', async () => {
      getOrganization.mockReturnValue(fake.Organization());
      getBasePlan.mockReturnValue(fake.Plan({ customerType: 'Free' }));

      await build();

      expect(screen.queryByTestId('users-limit-banner')).toBeVisible();
    });

    it('should show it when the user is in a Self Service plan and reached the limit of users', async () => {
      getOrganization.mockReturnValue(fake.Organization());
      getMemberships.mockReturnValue({
        items: getMockUsers(THRESHOLD_NUMBER_TO_DISPLAY_BANNER),
        total: 13,
      });
      getBasePlan.mockReturnValue(fake.Plan({ customerType: 'Self-service' }));

      await build();

      expect(screen.queryByTestId('users-limit-banner')).toBeVisible();
    });
  });
});
