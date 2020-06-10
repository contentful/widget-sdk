import React from 'react';
import { render, screen, within, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangeOnDemandWizard from './ChangeOnDemandWizard';
import * as Fake from 'test/helpers/fakeFactory';
import {
  getSpaceRatePlans,
  getSubscriptionPlans,
  calculateTotalPrice,
} from 'account/pricing/PricingDataProvider';
import * as utils from '../shared/utils';
import createResourceService from 'services/ResourceService';
import cleanupNotifications from 'test/helpers/cleanupNotifications';
import { currentMicroSpace, mediumSpace, freeSpace } from '../__test__/fixtures/plans';
import { createResourcesForPlan, FULFILLMENT_STATUSES } from '../__test__/helpers';

const mockOrganization = Fake.Organization({ isBillable: true });
const mockSpace = Fake.Space();

const mockFreeSpaceResource = Fake.OrganizationResource(1, 5, 'free_space');

const mockPlans = [currentMicroSpace, mediumSpace];
const mockResources = createResourcesForPlan(currentMicroSpace, FULFILLMENT_STATUSES.REACHED);

jest.spyOn(utils, 'transformSpaceRatePlans');
jest.spyOn(utils, 'changeSpacePlan').mockImplementation(async () => {});

jest.mock('account/pricing/PricingDataProvider', () => ({
  getSpaceRatePlans: jest.fn(),
  getSubscriptionPlans: jest.fn().mockResolvedValue({ items: [] }),
  calculateTotalPrice: jest.fn().mockReturnValue(0),
}));

jest.mock('services/ResourceService', () => {
  const service = {
    get: jest.fn((type) => {
      if (type === 'free_space') {
        return mockFreeSpaceResource;
      }
    }),
    getAll: jest.fn(async () => {
      return mockResources;
    }),
  };

  return () => service;
});

jest.useFakeTimers();

describe('ChangeOnDemandWizard', () => {
  beforeEach(() => {
    getSpaceRatePlans.mockResolvedValue(mockPlans);
  });

  afterEach(cleanupNotifications);

  it('should show the loading spinner initially', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
  });

  it('should fetch all the data initially', async () => {
    const service = createResourceService();
    await build();

    expect(service.get).toBeCalledWith('free_space');
    expect(service.getAll).toBeCalled();
    expect(getSubscriptionPlans).toBeCalledWith(expect.any(Function));
    expect(getSpaceRatePlans).toBeCalledWith(expect.any(Function), mockSpace.sys.id);

    expect(utils.transformSpaceRatePlans).toBeCalledWith({
      organization: mockOrganization,
      spaceRatePlans: mockPlans,
      freeSpaceResource: mockFreeSpaceResource,
    });
    expect(calculateTotalPrice).toBeCalled();
  });

  it('should show the SpacePlanSelector initially and disable the confirmation tab', async () => {
    await build();

    expect(screen.getByTestId('space-plan-selector')).toBeVisible();
    expect(screen.getByTestId('confirmation-tab')).toHaveAttribute('aria-disabled', 'true');
  });

  it('should go to the confirmation screen once a space plan is selected', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('space-plan-item')[1]);

    expect(screen.getByTestId('confirmation-tab')).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('confirmation-screen')).toBeVisible();
  });

  it('should recommend the bigger plan if there is a plan to recommend', async () => {
    await build();

    // The medium space should be recommended
    const mediumPlanElement = screen.getAllByTestId('space-plan-item').find((ele) => {
      return within(ele).getByTestId('space-plan-name').textContent === 'Medium';
    });
    expect(mediumPlanElement).toHaveAttribute('class', expect.stringMatching('recommendedPlan'));
  });

  it('shouid not recommend the bigger plan is there is no plan to recommend', async () => {
    getSpaceRatePlans.mockClear().mockResolvedValue([currentMicroSpace, freeSpace]);

    await build();

    screen.getAllByTestId('space-plan-item').forEach((planEle) => {
      expect(planEle).not.toHaveAttribute('class', expect.stringMatching('recommendedPlan'));
    });
  });

  it('should call onProcessing with true when the change is confirmed', async () => {
    const onProcessing = jest.fn();
    await build({ onProcessing });

    userEvent.click(screen.getAllByTestId('space-plan-item')[1]);
    userEvent.click(screen.getByTestId('confirm-button'));

    await waitFor(() => expect(onProcessing).toBeCalledWith(true));
  });

  it('should hide the close button while the space plan is being changed', async () => {
    await build();

    expect(screen.getByTestId('close-icon')).toBeVisible();

    userEvent.click(screen.getAllByTestId('space-plan-item')[1]);
    userEvent.click(screen.getByTestId('confirm-button'));

    await waitFor(() => expect(screen.queryByTestId('close-icon')).toBeNull());
  });

  it('should call changeSpacePlan with the current space and new plan, and call onClose when successful', async () => {
    const onClose = jest.fn();
    await build({ onClose });

    userEvent.click(screen.getAllByTestId('space-plan-item')[1]);
    userEvent.click(screen.getByTestId('confirm-button'));

    expect(utils.changeSpacePlan).toBeCalledWith({
      space: mockSpace,
      plan: utils.transformSpaceRatePlan({
        organization: mockOrganization,
        plan: mockPlans[1],
        freeSpaceResource: mockFreeSpaceResource,
      }),
    });

    await waitFor(() => expect(onClose).toBeCalled());

    expect(onClose).toBeCalledWith(
      utils.transformSpaceRatePlan({
        organization: mockOrganization,
        plan: mockPlans[1],
        freeSpaceResource: mockFreeSpaceResource,
      })
    );
  });

  it('should not call onClose and should trigger a notification if changeSpacePlan rejects', async () => {
    utils.changeSpacePlan.mockRejectedValueOnce(new Error());

    const onClose = jest.fn();
    await build({ onClose });

    userEvent.click(screen.getAllByTestId('space-plan-item')[1]);
    userEvent.click(screen.getByTestId('confirm-button'));

    await waitFor(() => screen.getByTestId('cf-ui-notification'));

    expect(onClose).not.toBeCalled();
    expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
  });
});

async function build(custom, shouldWait = true) {
  const props = Object.assign(
    {
      organization: mockOrganization,
      space: mockSpace,
      onClose: () => {},
      onProcessing: () => {},
    },
    custom
  );

  render(<ChangeOnDemandWizard {...props} />);

  if (shouldWait) {
    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));
  }
}
