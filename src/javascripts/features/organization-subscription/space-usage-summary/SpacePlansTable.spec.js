import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';

import { getSpacesUsage } from '../services/SpacesUsageService';
import { SpacePlansTable } from './SpacePlansTable';

const mockOrgId = 'random_org_id';
const mockSpaceForPlanOne = fake.Space({ name: 'Space A', sys: { id: 'space_1' } });
const mockSpaceForPlanTwo = fake.Space({ name: 'Space B', sys: { id: 'space_2' } });

const mockPlanOne = {
  sys: { id: 'random_id_1' },
  name: 'random_name_1',
  planType: 'free_space',
  space: mockSpaceForPlanOne,
  price: 789,
};

const mockPlanTwo = {
  sys: { id: 'random_id_2' },
  name: 'random_name_2',
  planType: 'free_space',
  space: mockSpaceForPlanTwo,
  price: 456,
};

const mockPlans = [mockPlanOne, mockPlanTwo];

const mockUsage = {
  contentTypes: {
    usage: 100,
    limit: 100,
    utilization: 1,
  },
  environments: {
    usage: 100,
    limit: 100,
    utilization: 1,
  },
  records: {
    usage: 100,
    limit: 100,
    utilization: 1,
  },
  locales: {
    usage: 100,
    limit: 100,
    utilization: 1,
  },
  roles: {
    usage: 100,
    limit: 100,
    utilization: 1,
  },
};

const mockSpaceUsageForPlanOne = {
  ...mockUsage,
  sys: {
    id: '123',
    space: {
      sys: {
        id: mockSpaceForPlanOne.sys.id,
      },
    },
  },
};

const mockSpaceUsageForPlanTwo = {
  ...mockUsage,
  sys: {
    id: '456',
    space: {
      sys: {
        id: mockSpaceForPlanTwo.sys.id,
      },
    },
  },
};

const mockSpaceUsage = [mockSpaceUsageForPlanOne, mockSpaceUsageForPlanTwo];

jest.mock('utils/SubscriptionUtils', () => ({
  getEnabledFeatures: jest.fn().mockImplementation(() => {
    return [];
  }),
}));

jest.mock('../services/SpacesUsageService', () => ({
  getSpacesUsage: jest.fn().mockResolvedValue({ items: [], total: 0 }),
}));

jest.mock('../hooks/useChangedSpace', () => ({
  useChangedSpace: jest
    .fn()
    .mockReturnValue({ changedSpaceId: 'space_id', setChangedSpaceId: jest.fn() }),
}));

describe('SpacePlansTable', () => {
  beforeEach(() => {
    getSpacesUsage.mockResolvedValue({ items: mockSpaceUsage, total: mockSpaceUsage.length });
  });

  it('should not render SpacePlanRows when there are no plans', async () => {
    build({ plans: [] });

    await waitFor(() =>
      expect(screen.queryAllByTestId('subscription-page.spaces-list.table-row')).toHaveLength(0)
    );
  });

  it('should render SpacePlanRows when there are plans', async () => {
    build();

    await waitFor(() => {
      const tableRows = screen.queryAllByTestId('subscription-page.spaces-list.table-row');
      expect(tableRows).toHaveLength(mockSpaceUsage.length);
    });
  });

  it('should render an upgraded SpacePlanRow when it has been upgraded', async () => {
    build({ upgradedSpaceId: mockSpaceForPlanOne.sys.id });

    await waitFor(() =>
      expect(
        screen
          .queryAllByTestId('subscription-page.spaces-list.table-row')[0]
          .className.includes('hasUpgraded')
      ).toBeTrue()
    );
  });

  it('should sort the table by space name when space name header cell is clicked', async () => {
    build();
    let tableRows;
    let spaceNameOfFirstRow;

    await waitFor(() => {
      tableRows = screen.queryAllByTestId('subscription-page.spaces-list.table-row');
      expect(tableRows).toHaveLength(mockSpaceUsage.length);
      spaceNameOfFirstRow = within(tableRows[0]).getByTestId(
        'subscription-page.spaces-list.space-name'
      );
      expect(spaceNameOfFirstRow).toHaveTextContent(mockSpaceForPlanOne.name);
    });

    const spaceNameHeaderCell = screen.getByText('Name');
    fireEvent.click(spaceNameHeaderCell);

    await waitFor(() => {
      tableRows = screen.queryAllByTestId('subscription-page.spaces-list.table-row');
      expect(tableRows).toHaveLength(mockSpaceUsage.length);
      spaceNameOfFirstRow = within(tableRows[0]).getByTestId(
        'subscription-page.spaces-list.space-name'
      );
      expect(spaceNameOfFirstRow).toHaveTextContent(mockSpaceForPlanOne.name);
    });
  });
});

function build(customProps) {
  const props = {
    enterprisePlan: false,
    featureFlagLoading: false,
    onChangeSpace: jest.fn(),
    onDeleteSpace: jest.fn(),
    organizationId: mockOrgId,
    plans: mockPlans,
    showSpacePlanChangeBtn: false,
    upgradedSpaceId: undefined,
    ...customProps,
  };

  render(<SpacePlansTable {...props} />);
}
