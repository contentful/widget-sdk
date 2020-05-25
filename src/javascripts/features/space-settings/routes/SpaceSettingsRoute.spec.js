import React from 'react';
import { screen, render, wait } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { getSpace } from 'services/TokenStore';
import {
  showDialog as showChangeSpaceModal,
  getNotificationMessage,
} from 'services/ChangeSpaceService';
import reducer from 'redux/reducer';
import { createStore } from 'redux';

import { getRatePlans, getSingleSpacePlan } from 'account/pricing/PricingDataProvider';

import { track } from 'analytics/Analytics';
import { SpaceSettingsRoute } from './SpaceSettingsRoute';
import * as fake from 'test/helpers/fakeFactory';
import * as spaceContextMocked from 'ng/spaceContext';

jest.mock('services/ChangeSpaceService', () => ({
  showChangeSpaceModal: jest.fn(),
  showDialog: jest.fn(),
  getNotificationMessage: jest.fn(),
}));

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  getSingleSpacePlan: jest.fn(),
  getRatePlans: jest.fn(),
}));

const build = async (waitToRender = true) => {
  // Need Provider and store even though they aren't used for jest to run the tests.
  const store = createStore(reducer);
  const renderedComponent = render(
    <Provider store={store}>
      <SpaceSettingsRoute />
    </Provider>
  );

  if (waitToRender) {
    await wait();
  }

  return renderedComponent;
};

describe('SpaceSettingsRoute', () => {
  const testSpace = fake.Space();
  const testOrganization = fake.Organization();
  const mediumPlan = { name: 'firstPlan', price: 10, sys: { id: 1 } };
  const largePlan = { name: 'firstPlan', price: 99, sys: { id: 2 } };
  const notificationMessage = 'This is a notification';

  getSingleSpacePlan.mockResolvedValue(mediumPlan);
  getRatePlans.mockResolvedValue([mediumPlan, largePlan]);

  getSpace.mockResolvedValue(testSpace);
  getNotificationMessage.mockReturnValue(notificationMessage);

  spaceContextMocked.organization = testOrganization;
  spaceContextMocked.space.data = { name: 'test', sys: { id: 987 } };
  spaceContextMocked.space.getId.mockReturnValue('spaceId123');

  it('should with properly load with a spinner, then display the information', async () => {
    build(false);

    expect(screen.queryByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-space-plan-card')).not.toBeInTheDocument();

    await wait();

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-space-plan-card')).toBeInTheDocument();
    expect(screen.getByTestId('space-settings-page.plan-price')).toHaveTextContent(
      `${mediumPlan.name} - $${mediumPlan.price} /month`
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

  it('should with call changeSpaceDialog with all the right things', async () => {
    getSingleSpacePlan.mockResolvedValue(mediumPlan);
    showChangeSpaceModal.mockImplementation((argumentVariables) => {
      // Pretend that the user selected the large plan in the showChangeSpaceModal.
      argumentVariables.onSubmit(largePlan.sys.id);
    });

    await build();

    expect(await screen.getByTestId('space-settings-page.plan-price')).toHaveTextContent(
      `${mediumPlan.name} - $${mediumPlan.price} /month`
    );
    userEvent.click(screen.getByTestId('upgrade-space-button'));

    await wait();

    expect(showChangeSpaceModal).toBeCalledWith({
      action: 'change',
      organizationId: testOrganization.sys.id,
      space: testSpace,
      scope: 'space',
      onSubmit: expect.any(Function),
    });

    expect(track).toBeCalledWith('space_settings:upgrade_plan_link_clicked', {
      organizationId: testOrganization.sys.id,
      spaceId: testSpace.sys.id,
    });

    expect(await screen.findByText(notificationMessage)).toBeInTheDocument();
    expect(screen.getByTestId('space-settings-page.plan-price')).toHaveTextContent(
      `${largePlan.name} - $${largePlan.price} /month`
    );
  });
});
