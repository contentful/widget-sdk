import React from 'react';
import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';

import { FREE } from 'account/pricing/PricingDataProvider';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';

import { OrgSubscriptionContextProvider } from '../context';
import { mockWebappContent } from './__mocks__/webappContent';
import { NonEnterpriseSubscriptionPage } from './NonEnterpriseSubscriptionPage';

jest.mock('core/services/ContentfulCDA/fetchWebappContentByEntryID', () => ({
  fetchWebappContentByEntryID: jest.fn((_entryId, _query) => Promise.resolve({})),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true),
}));

jest.mock('features/trials', () => ({
  useAppsTrial: jest.fn().mockReturnValue({}),
}));

const mockOrganization = Fake.Organization();
const mockFreeBasePlan = Fake.Plan({ name: 'Community Platform', customerType: FREE });
const mockFreeSpacePlan = {
  name: 'Mock free space',
  planType: 'free_space',
  space: { sys: { id: 'test' } },
};

describe('NonEnterpriseSubscriptionPage', () => {
  beforeEach(() => {
    fetchWebappContentByEntryID.mockReset().mockResolvedValue(mockWebappContent);
  });
  afterEach(cleanup);

  describe('BasePlan section', () => {
    it('show the BasePlanCard initially loading', async () => {
      await build();

      const basePlanCard = screen.getByTestId('base-plan-card');
      const skeletons = within(basePlanCard).queryAllByTestId('cf-ui-skeleton-form');

      expect(basePlanCard).toBeVisible();
      skeletons.forEach((skeleton) => expect(skeleton).toBeVisible());
    });

    it('show the BasePlanCard with the fetched content', async () => {
      await build();

      const basePlanCard = screen.getByTestId('base-plan-card');

      expect(basePlanCard).toBeVisible();

      await waitFor(() => {
        expect(screen.getByTestId('base-plan-title')).toBeVisible();
      });
    });
  });

  describe('Monthly Total section', () => {
    it('should show the monthly cost for on demand users', async () => {
      await build({ organization: Fake.Organization({ isBillable: true }), grandTotal: 3000 });

      expect(screen.getByText('Monthly total')).toBeVisible();
      expect(screen.getByTestId('on-demand-monthly-cost')).toHaveTextContent('$3,000');
    });
  });

  describe('Contentful Apps section', () => {
    it('render Contentful Apps card for owners and admins', async () => {
      await build();

      expect(screen.getByTestId('contentful-apps-card')).toBeVisible();
    });

    it('does not render Contentful Apps card for members', async () => {
      isOwnerOrAdmin.mockReturnValue(false);
      await build();

      expect(screen.queryByTestId('contentful-apps-card')).toBeNull();
    });
  });

  describe('Spaces section', () => {
    it('shows the space plans’ table', async () => {
      await build();

      const spacesTable = screen.getByTestId('subscription-page.table');
      expect(spacesTable).toBeVisible();
    });
  });
});

async function build(customProps) {
  const props = {
    initialLoad: false,
    organization: mockOrganization,
    basePlan: mockFreeBasePlan,
    spacePlans: [mockFreeSpacePlan],
    grandTotal: null,
    usersMeta: null,
    onSpacePlansChange: null,
    ...customProps,
  };

  const state = {
    spacePlans: [mockFreeSpacePlan],
  };

  render(
    <OrgSubscriptionContextProvider initialState={state}>
      <NonEnterpriseSubscriptionPage {...props} />
    </OrgSubscriptionContextProvider>
  );

  await waitFor(() => {
    expect(fetchWebappContentByEntryID).toHaveBeenCalled();
  });
}
