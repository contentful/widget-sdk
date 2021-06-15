import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';

import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';

import { mockWebappContent } from './__mocks__/webappContent';
import { BasePlanContentEntryIds } from '../types';
import { OrgSubscriptionContextProvider } from '../context/OrgSubscriptionContext';
import { EnterpriseSubscriptionPage } from './EnterpriseSubscriptionPage';
import { MemoryRouter } from 'core/react-routing';

jest.mock('core/services/ContentfulCDA/fetchWebappContentByEntryID', () => ({
  fetchWebappContentByEntryID: jest.fn((_entryId, _query) => Promise.resolve({})),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

const mockOrganization = Fake.Organization();
const mockTrialOrganization = Fake.Organization({
  trialPeriodEndsAt: new Date(),
});
const mockFreeSpacePlan = {
  name: 'Mock free space',
  planType: 'free_space',
  space: { sys: { id: 'test' } },
};

describe('EnterpriseSubscriptionPage', () => {
  beforeEach(() => {
    isOwnerOrAdmin.mockReturnValue(true);
    fetchWebappContentByEntryID.mockReset().mockResolvedValue(mockWebappContent);
  });

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

    it('fetches Enterprise content by default', async () => {
      await build();

      expect(fetchWebappContentByEntryID).toHaveBeenCalledWith(BasePlanContentEntryIds.ENTERPRISE);
    });

    it('fetches Enterprise trial content when organization has trialPeriodEndsAt', async () => {
      await build({ organization: mockTrialOrganization });

      expect(fetchWebappContentByEntryID).toHaveBeenCalledWith(
        BasePlanContentEntryIds.ENTERPRISE_TRIAL
      );
    });

    it('fetches Internal Sandbox content when basePlan has "Internal" in its name', async () => {
      await build({ isInternalBasePlan: true });

      expect(fetchWebappContentByEntryID).toHaveBeenCalledWith(
        BasePlanContentEntryIds.CONTENTFUL_INTERNAL
      );
    });
  });

  describe('Enterprise trial info', () => {
    it('should show EnterpriseTrialInfo for organizations on Enterprise trial', async () => {
      await build({ organization: mockTrialOrganization });

      expect(screen.getByTestId('platform-trial-info')).toBeVisible();
    });
  });

  describe('Spaces section', () => {
    it('shows the space plans’ table', async () => {
      await build();

      const spacesTable = screen.getByTestId('subscription-page.table');
      expect(spacesTable).toBeVisible();
    });

    it('shows SpacesListForMembers if organization is on trial AND user is not admin or owner', async () => {
      isOwnerOrAdmin.mockReturnValue(false);
      await build({ organization: mockTrialOrganization });

      const spacesListForMembers = screen.getByTestId('subscription-page-trial-members.heading');
      expect(spacesListForMembers).toBeVisible();
    });
  });
});

async function build(customProps) {
  const props = {
    memberAccessibleSpaces: [],
    onSpacePlansChange: jest.fn(),
    organization: mockOrganization,
    usersMeta: null,
    ...customProps,
  };

  const state = {
    spacePlans: [mockFreeSpacePlan],
  };

  render(
    <MemoryRouter>
      <OrgSubscriptionContextProvider initialState={state}>
        <EnterpriseSubscriptionPage {...props} />
      </OrgSubscriptionContextProvider>
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(fetchWebappContentByEntryID).toHaveBeenCalled();
  });
}
