import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';

import { OrgSubscriptionContextProvider } from '../context';
import { getSpacesUsage } from '../services/SpacesUsageService';
import { SpacePlans } from './SpacePlans';
import { getVariation } from 'core/feature-flags';
import { MemoryRouter } from 'core/react-routing';

const mockOrgId = 'random_org_id';
const mockSpaceId = 'fake_space_id';
const mockSpaceForPlanOne = fake.Space({ sys: { id: mockSpaceId } });
const mockSpaceForPlanTwo = fake.Space();

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
  usage: 100,
  limit: 100,
  utilization: 1,
};

const mockSpaceUsage = {
  contentTypes: mockUsage,
  environments: mockUsage,
  records: mockUsage,
  locales: mockUsage,
  roles: mockUsage,
  sys: {
    id: '123',
    space: {
      sys: {
        id: mockSpaceId,
      },
    },
  },
};

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

describe('Space Plan', () => {
  describe('SpaceSectionHeader', () => {
    it('renders the space section header', async () => {
      getVariation.mockResolvedValueOnce(true);
      build();

      await waitFor(() => expect(screen.getByTestId('space-section-header')).toBeVisible());
      expect(screen.queryByTestId('space-section-header-previous-version')).toBeNull();
    });
  });

  describe('SpacePlansTable', () => {
    it('should tell the user to add a space if they have 0 space plans, if feature flag is ON', async () => {
      getVariation.mockResolvedValueOnce(true);
      build(null, { spacePlans: [] });

      await waitFor(() =>
        expect(screen.getByText('Add a space to start using Contentful.')).toBeVisible()
      );
    });

    it('should not render SpacePlansTable when there are no plans, if the feature flag is OFF', async () => {
      build(null, { spacePlans: [] });

      await waitFor(() => expect(screen.queryByTestId('subscription-page.table')).toBeNull());
    });

    it('should render the SpacePlansTable when user has at least 1 plan', async () => {
      build();

      await waitFor(() => expect(screen.getByTestId('subscription-page.table')).toBeVisible());
    });
  });

  describe('UsedAndUnusedSpacePlans', () => {
    it('should display 2 tabs for enterprise organization if there are plans unassigned.', async () => {
      const mockPlanLocalOne = {
        ...mockPlanOne,
        gatekeeperKey: null,
      };
      const mockPlanLocalTwo = {
        ...mockPlanTwo,
        gatekeeperKey: 'randomKey',
      };

      build(
        {
          enterprisePlan: true,
          initialLoad: false,
          isOwnerOrAdmin: true,
        },
        { spacePlans: [mockPlanLocalOne, mockPlanLocalTwo] }
      );

      await waitFor(() => expect(screen.getByTestId('tab-usedSpaces')).toBeVisible());
      expect(screen.queryByTestId('tab-unusedSpaces')).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);

      fireEvent.click(screen.getByTestId('tab-unusedSpaces'));

      await waitFor(() =>
        expect(screen.getByTestId('subscription-page.unassigned-plans-table')).toBeVisible()
      );

      expect(
        screen.queryAllByTestId('subscription-page.spaces-list.unassigned-plans-table-row')
      ).toHaveLength(1);
    });

    it('should not display tabs for enterprise organization if there are no plans unassigned.', async () => {
      getSpacesUsage.mockResolvedValue({ items: [mockSpaceUsage], total: 1 });

      build({
        enterprisePlan: true,
        isOwnerOrAdmin: true,
      });

      await waitFor(() => expect(screen.getByTestId('subscription-page.table')).toBeVisible());
      const tabs = screen.queryAllByRole('tab');
      expect(tabs).toHaveLength(0);
    });
  });
});

function build(customProps, customState) {
  const props = {
    initialLoad: false,
    enterprisePlan: false,
    organizationId: mockOrgId,
    anySpacesInaccessible: false,
    ...customProps,
  };

  const state = {
    spacePlans: mockPlans,
    ...customState,
  };

  render(
    <MemoryRouter>
      <OrgSubscriptionContextProvider initialState={state}>
        <SpacePlans {...props} />
      </OrgSubscriptionContextProvider>
    </MemoryRouter>
  );
}
