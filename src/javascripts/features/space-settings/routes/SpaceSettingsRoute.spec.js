import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { getSpace } from 'services/TokenStore';
import { beginSpaceChange, getNotificationMessage } from 'services/ChangeSpaceService';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import * as trackCTA from 'analytics/trackCTA';

import { openDeleteSpaceDialog } from '../services/DeleteSpace';
import { getRatePlans, getSingleSpacePlan } from 'account/pricing/PricingDataProvider';

import { SpaceSettingsRoute } from './SpaceSettingsRoute';
import * as fake from 'test/helpers/fakeFactory';
import * as spaceContextMocked from 'ng/spaceContext';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';

jest.mock('services/ChangeSpaceService', () => ({
  beginSpaceChange: jest.fn(),
  getNotificationMessage: jest.fn(),
}));

jest.mock('../services/DeleteSpace', () => ({
  openDeleteSpaceDialog: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
  getOrganization: jest.fn(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  getSingleSpacePlan: jest.fn(),
  getRatePlans: jest.fn(),
}));

const trackCTAClick = jest.spyOn(trackCTA, 'trackCTAClick');

const build = async (shouldWait = true) => {
  const renderedComponent = render(
    <SpaceEnvContextProvider>
      <SpaceSettingsRoute />
    </SpaceEnvContextProvider>
  );

  if (shouldWait) {
    await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());
  }

  return renderedComponent;
};

describe('SpaceSettingsRoute', () => {
  const testSpace = fake.Space();
  const mediumPlan = { name: 'firstPlan', price: 10, sys: { id: 1 } };
  const largePlan = { name: 'firstPlan', price: 99, sys: { id: 2 } };
  const notificationMessage = 'This is a notification';

  getSingleSpacePlan.mockResolvedValue(mediumPlan);
  getRatePlans.mockResolvedValue([mediumPlan, largePlan]);

  getSpace.mockResolvedValue(testSpace);
  getNotificationMessage.mockReturnValue(notificationMessage);
  isOwnerOrAdmin.mockReturnValue(false);

  spaceContextMocked.space.data = testSpace;

  it('should with properly load with a spinner, then display the information', async () => {
    build(false);

    expect(screen.queryByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-space-plan-card')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());

    expect(screen.queryByTestId('upgrade-space-plan-card')).toBeInTheDocument();
    expect(screen.getByTestId('space-settings-page.plan-price')).toHaveTextContent(
      `${mediumPlan.name} - $${mediumPlan.price}/month`
    );
  });

  it('should not throw an error when it is a v1 space with no plan', async () => {
    getSingleSpacePlan.mockImplementation(() => {
      throw new Error();
    });

    await build();

    expect(screen.queryByTestId('space-information-card')).toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-space-plan-card')).not.toBeInTheDocument();
  });

  it('should with call changeSpaceDialog and track the CTA click', async () => {
    getSingleSpacePlan.mockResolvedValue(mediumPlan);
    beginSpaceChange.mockImplementation((argumentVariables) => {
      // Pretend that the user selected the large plan in the beginSpaceChange.
      argumentVariables.onSubmit(largePlan);
    });
    isOwnerOrAdmin.mockReturnValue(true);

    await build();

    expect(screen.getByTestId('space-settings-page.plan-price')).toHaveTextContent(
      `${mediumPlan.name} - $${mediumPlan.price}/month`
    );
    userEvent.click(screen.getByTestId('upgrade-space-button'));

    await waitFor(() => expect(beginSpaceChange).toBeCalled());

    expect(trackCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_SPACE_PLAN, {
      organizationId: testSpace.organization.sys.id,
      spaceId: testSpace.sys.id,
    });

    expect(beginSpaceChange).toBeCalledWith({
      organizationId: testSpace.organization.sys.id,
      space: testSpace,
      onSubmit: expect.any(Function),
    });

    expect(await screen.findByText(notificationMessage)).toBeInTheDocument();
    expect(screen.getByTestId('space-settings-page.plan-price')).toHaveTextContent(
      `${largePlan.name} - $${largePlan.price}/month`
    );
  });

  it('should call openRemovalDialog when the user clicks on the delete space button', async () => {
    isOwnerOrAdmin.mockReturnValue(true);
    await build();

    userEvent.click(screen.getByTestId('delete-space'));

    await waitFor(() => {
      expect(openDeleteSpaceDialog).toBeCalledWith({
        onSuccess: expect.any(Function),
        plan: mediumPlan,
        space: spaceContextMocked.space.data,
      });
    });
  });
});
