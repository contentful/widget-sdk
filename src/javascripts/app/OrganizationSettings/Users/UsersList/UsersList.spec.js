import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { generateFilterDefinitions } from './FilterDefinitions';
import { UsersList } from './UsersList';
import { ModalLauncher } from 'core/components/ModalLauncher';
import * as fake from 'test/helpers/fakeFactory';
import cleanupNotifications from 'test/helpers/cleanupNotifications';
import { removeMembership, getMemberships } from 'access_control/OrganizationMembershipRepository';
import { LocationStateContext, LocationDispatchContext } from 'core/services/LocationContext';

const filters = generateFilterDefinitions({ hasSsoEnabled: true });

const mockOrg = fake.Organization();
const user1 = fake.User({
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@example.com',
});
const user2 = fake.User({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
});
const user3 = fake.User({
  firstName: 'James',
  lastName: 'Bond',
  email: 'james@example.com',
});
const mockOrgMemberships = [
  fake.OrganizationMembership('member', 'pending', user1),
  fake.OrganizationMembership('member', 'active', user2),
  fake.OrganizationMembership('member', 'active', user3),
];
const spaceRoleOne = fake.SpaceRole('Role 1');
const spaceRoleTwo = fake.SpaceRole('Role 2');
const spaceOne = fake.Space('Space 1');
const spaceTwo = fake.Space('Space 2');

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getMemberships: jest.fn(async () => ({ items: mockOrgMemberships, total: 13 })), //mock bigger total to test pagination
  removeMembership: jest.fn(),
}));

const mockOrgEndpoint = jest.fn();
jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn(() => mockOrgEndpoint),
}));
jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(() => mockOrg),
}));
jest.mock('account/pricing/PricingDataProvider', () => {
  const isFreePlan = jest.fn(() => true);
  return {
    isFreePlan,
    getBasePlan: jest.fn(),
  };
});

jest.useFakeTimers();

const locationValueWithSearch = { search: '?order=-sys.createdAt&sys.status=pending' };
const locationValueWithSSO = {
  search: '?order=-sys.createdAt&sys.sso.lastSignInAt%5Bexists%5D=true',
};
const updateLocation = jest.fn();

async function build(locationValue = {}) {
  render(
    <LocationStateContext.Provider value={locationValue}>
      <LocationDispatchContext.Provider value={updateLocation}>
        <UsersList
          orgId={mockOrg.sys.id}
          spaceRoles={[spaceRoleOne, spaceRoleTwo]}
          spaces={[spaceOne, spaceTwo]}
          teams={[]}
          hasSsoEnabled={true}
          hasTeamsFeature={false}
        />
      </LocationDispatchContext.Provider>
    </LocationStateContext.Provider>
  );

  return waitFor(() =>
    expect(screen.getAllByTestId('organization-membership-list-row')).toHaveLength(
      mockOrgMemberships.length
    )
  );
}

describe('UsersList', () => {
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

  it('should call updateLocation and getMemberships with correct args when filters change', async () => {
    await build(locationValueWithSearch);

    //user sets status filter to Invited
    const selectEl = screen.getAllByTestId('search-filter.options');
    fireEvent.change(selectEl[1], {
      target: {
        value: 'pending',
      },
    });

    expect(updateLocation).toHaveBeenCalledWith({
      order: '-sys.createdAt',
      'sys.status': 'pending',
    });

    expect(getMemberships).toHaveBeenCalledWith(mockOrgEndpoint, {
      order: '-sys.createdAt',
      'sys.status': 'pending',
      query: '',
      include: ['sys.user'],
      skip: 0,
      limit: 10,
    });
    await screen.findAllByTestId('organization-membership-list-row');
  });

  it('should call updateLocation and getMemberships with correct args when filters with operator change', async () => {
    await build(locationValueWithSSO);

    //user sets SSO filter to Has logged in
    const selectEl = screen.getAllByTestId('search-filter.options');
    fireEvent.change(selectEl[5], {
      target: {
        value: 'true',
      },
    });

    expect(updateLocation).toHaveBeenCalledWith({
      order: '-sys.createdAt',
      'sys.sso.lastSignInAt[exists]': 'true',
    });

    expect(getMemberships).toHaveBeenCalledWith(mockOrgEndpoint, {
      order: '-sys.createdAt',
      'sys.sso.lastSignInAt[exists]': 'true',
      query: '',
      include: ['sys.user'],
      skip: 0,
      limit: 10,
    });
    await screen.findAllByTestId('organization-membership-list-row');
  });

  it('should call clear filters on click reset', async () => {
    await build(locationValueWithSearch);

    getMemberships.mockClear();
    //user resets filters
    expect(screen.getByText('Clear filters')).toBeVisible();
    fireEvent.click(screen.getByText('Clear filters'));
    expect(updateLocation).toHaveBeenCalledWith({});

    await screen.findAllByTestId('organization-membership-list-row');
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

    const removeBtns = screen.getAllByText('Remove');
    await waitFor(() => fireEvent.click(removeBtns[0]));
    ModalLauncher.open.mockResolvedValueOnce(true);
    expect(ModalLauncher.open).toHaveBeenCalled();
    expect(removeMembership).toHaveBeenCalled();

    expect(screen.getAllByTestId('organization-membership-list-row')).toHaveLength(
      mockOrgMemberships.length - 1
    );
    await waitFor(() => screen.getByTestId('cf-ui-notification'));
  });
});
