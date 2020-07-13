import React from 'react';
import { cloneDeep } from 'lodash';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { generateFilterDefinitions } from './FilterDefinitions';
import { UsersList } from './UsersList';
import { ModalLauncher } from 'core/components/ModalLauncher';
import * as fake from 'test/helpers/fakeFactory';
import cleanupNotifications from 'test/helpers/cleanupNotifications';
import { removeMembership, getMemberships } from 'access_control/OrganizationMembershipRepository';

const filters = generateFilterDefinitions({});
const activeFilters = cloneDeep(filters);
activeFilters[1].filter = { key: 'sys.status', value: 'active' };

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

async function build(props) {
  const spaceRoleOne = fake.SpaceRole('Role 1');
  const spaceRoleTwo = fake.SpaceRole('Role 2');
  const spaceOne = fake.Space('Space 1');
  const spaceTwo = fake.Space('Space 2');

  render(
    <UsersList
      orgId={mockOrg.sys.id}
      spaceRoles={[spaceRoleOne, spaceRoleTwo]}
      spaces={[spaceOne, spaceTwo]}
      filters={filters}
      teams={[]}
      hasSsoEnabled={false}
      hasTeamsFeature={false}
      {...props}
    />
  );

  return waitFor(() =>
    expect(screen.getAllByTestId('organization-membership-list-row')).toHaveLength(
      mockOrgMemberships.length
    )
  );
}

describe('UsersList', () => {
  afterEach(cleanupNotifications);
  it('should render users list and filters', async () => {
    await build();
    expect(screen.getAllByTestId('search-filter')).toHaveLength(filters.length);
    expect(screen.getAllByTestId('organization-membership-list-row')).toHaveLength(
      mockOrgMemberships.length
    );
  });

  it('should call getMemberships with correct query when filters change', async () => {
    await build();
    const query = {
      order: '-sys.createdAt',
      query: '',
      include: ['sys.user'],
      skip: 0,
      limit: 10,
    };

    //user sets status filter to Invited
    const selectEl = screen.getAllByTestId('search-filter.options');
    fireEvent.change(selectEl[1], {
      target: {
        value: 'pending',
      },
    });
    expect(getMemberships).toHaveBeenCalledWith(mockOrgEndpoint, {
      ...query,
      'sys.status': 'pending',
    });
    await screen.findAllByTestId('organization-membership-list-row');
  });

  it('should call getMemberships with initial query when filters reset', async () => {
    await build();
    const query = {
      order: '-sys.createdAt',
      query: '',
      include: ['sys.user'],
      skip: 0,
      limit: 10,
    };

    //user sets status filter to Invited
    const selectEl = screen.getAllByTestId('search-filter.options');
    fireEvent.change(selectEl[1], {
      target: {
        value: 'pending',
      },
    });

    //user resets filters
    expect(screen.getByText('Clear filters')).toBeVisible();
    fireEvent.click(screen.getByText('Clear filters'));
    expect(getMemberships).toHaveBeenCalledWith(mockOrgEndpoint, query);
    await screen.findAllByTestId('organization-membership-list-row');
  });

  it('should get users with correct query when pagination changes', async () => {
    await build();
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
