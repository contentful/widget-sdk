import React from 'react';
import { render, screen, within, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { when } from 'jest-when';
import userEvent from '@testing-library/user-event';
import ChangeOnDemandWizard from './ChangeOnDemandWizard';
import * as Fake from 'test/helpers/fakeFactory';
import * as PricingDataProvider from 'account/pricing/PricingDataProvider';
import * as utils from '../shared/utils';
import cleanupNotifications from 'test/helpers/cleanupNotifications';
import { mediumSpaceCurrent, largeSpace, freeSpace } from '../__tests__/fixtures/plans';
import { createResourcesForPlan, FULFILLMENT_STATUSES } from '../__tests__/helpers';
import { mockEndpoint } from 'data/EndpointFactory';

const mockOrganization = Fake.Organization({ isBillable: true });
const mockSpace = Fake.Space();

const mockFreeSpaceResource = Fake.OrganizationResource(1, 5, 'free_space');

const mockPlans = [mediumSpaceCurrent, largeSpace];
const mockResources = createResourcesForPlan(mediumSpaceCurrent, {
  environment: FULFILLMENT_STATUSES.REACHED,
  locale: FULFILLMENT_STATUSES.NEAR,
});

jest.spyOn(utils, 'transformSpaceRatePlans');
jest.spyOn(utils, 'changeSpacePlan');
jest.spyOn(PricingDataProvider, 'getSubscriptionPlans');
jest.spyOn(PricingDataProvider, 'getSpaceRatePlans');
jest.spyOn(PricingDataProvider, 'calculateTotalPrice');
jest.spyOn(PricingDataProvider, 'changeSpacePlan');

mockEndpoint.mockRejectedValue();
when(mockEndpoint)
  .calledWith(expect.objectContaining({ path: ['product_rate_plans'] }))
  .mockResolvedValue({ items: mockPlans })
  .calledWith(expect.objectContaining({ path: ['plans'] }))
  .mockResolvedValue({ items: [] })
  .calledWith(expect.objectContaining({ path: [] }))
  .mockResolvedValue()
  .calledWith(expect.objectContaining({ path: ['resources'] }))
  .mockResolvedValue({ items: mockResources })
  .calledWith(expect.objectContaining({ path: ['resources', 'free_space'] }))
  .mockResolvedValue(mockFreeSpaceResource);

jest.useFakeTimers();

describe('ChangeOnDemandWizard', () => {
  afterEach(cleanupNotifications);

  it('should show the loading spinner initially', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
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

    // The perf 1x space should be recommended
    const mediumPlanElement = screen.getAllByTestId('space-plan-item').find((ele) => {
      return within(ele).getByTestId('space-plan-name').textContent === largeSpace.name;
    });
    expect(mediumPlanElement).toHaveAttribute('class', expect.stringMatching('recommendedPlan'));
  });

  it('shouid not recommend the bigger plan is there is no plan to recommend', async () => {
    when(mockEndpoint)
      .calledWith(expect.objectContaining({ path: ['product_rate_plans'] }))
      .mockResolvedValueOnce({
        items: [mediumSpaceCurrent, freeSpace],
      });

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
      plan: expect.objectContaining(mockPlans[1]),
    });

    await waitFor(() => expect(onClose).toBeCalled());
  });

  it('should not call onClose and should trigger a notification if the plans endpoint rejects', async () => {
    when(mockEndpoint)
      .calledWith(expect.objectContaining({ path: [] }))
      .mockRejectedValueOnce(new Error());

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
