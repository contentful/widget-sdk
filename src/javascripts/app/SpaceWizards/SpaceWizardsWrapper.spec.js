import React from 'react';
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { when } from 'jest-when';
import * as PricingDataProvider from 'account/pricing/PricingDataProvider';
import * as PricingEntities from 'features/pricing-entities';
import SpaceWizardsWrapper from './SpaceWizardsWrapper';
import * as Fake from 'test/helpers/fakeFactory';
import * as Analytics from 'analytics/Analytics';
import { freeSpace } from './__tests__/fixtures/plans';
import { mockSpaceEndpoint, mockOrganizationEndpoint } from 'data/EndpointFactory';
import * as utils from './shared/utils';

const mockOrganization = Fake.Organization({
  isBillable: true,
});
const mockSpace = Fake.Space();

const mockBasePlan = Fake.Plan({ customerType: PricingDataProvider.ENTERPRISE });
const mockFreeSpaceResource = Fake.OrganizationResource(1, 5, 'free_space');
const mockSpaceResources = [Fake.SpaceResource(1, 3, 'environment')];

// TODO(jo-sm): For some reason you can't do `jest.spyOn(PricingEntities, 'getBasePlan'). It returns
// an error, `TypeError: Cannot redefine property: getBasePlan`. I think this is related to the
// move to TS, and should be able to be fixed in tooling. This is a workaround.
jest.mock('features/pricing-entities', () => ({
  ...jest.requireActual('features/pricing-entities'),
  getBasePlan: jest.fn((...args) =>
    jest.requireActual('features/pricing-entities').getBasePlan(...args)
  ),
}));

mockOrganizationEndpoint.mockRejectedValue();
when(mockOrganizationEndpoint)
  .calledWith(expect.objectContaining({ path: ['product_rate_plans'] }))
  .mockResolvedValue({ items: [freeSpace] })
  .calledWith(expect.objectContaining({ path: ['plans'] }))
  .mockResolvedValue({ items: [mockBasePlan] })
  .calledWith(expect.objectContaining({ path: ['resources'] }))
  .mockResolvedValue({ items: [mockFreeSpaceResource] });
mockSpaceEndpoint.mockRejectedValue();
when(mockSpaceEndpoint)
  .calledWith(expect.objectContaining({ path: ['resources'] }))
  .mockResolvedValue({ items: mockSpaceResources });

jest.mock('services/SpaceTemplateLoader', () => ({
  getTemplatesList: jest.fn().mockResolvedValue([]),
}));

jest.spyOn(PricingDataProvider, 'isEnterprisePlan');

describe('SpaceWizardsWrapper', () => {
  it('should always get the base plan and determine if the plan is enterprise', async () => {
    await build();

    expect(PricingEntities.getBasePlan).toBeCalled();
    expect(PricingDataProvider.isEnterprisePlan).toBeCalled();
  });

  it('should show the loading spinner while the data is being fetched', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
  });

  it('should track the CANCEL event when clicking on the close button', async () => {
    const onClose = jest.fn();

    await build({ onClose });

    // The overlay does not have a testId, so we get it by getting the grandparent of the modal
    const overlay = screen.getByTestId('cf-ui-modal').parentElement.parentElement;

    userEvent.click(overlay);

    expect(Analytics.track).toBeCalledWith(
      `space_wizard:${utils.WIZARD_EVENTS.CANCEL}`,
      expect.objectContaining({
        intendedAction: utils.WIZARD_INTENT.CREATE,
      })
    );

    // onClose should be called with nothing
    expect(onClose).toBeCalledWith();
  });

  it('should not track the CANCEL event if the modal is closed before loading finishes', async () => {
    const onClose = jest.fn();

    build({ onClose }, false);

    const overlay = screen.getByTestId('cf-ui-modal').parentElement.parentElement;

    userEvent.click(overlay);

    expect(Analytics.track).toHaveBeenCalledTimes(0);
    expect(onClose).toBeCalledWith();

    // There's nothing to really wait for, except for the act call, so we wait for... nothing
    await waitFor(() => {});
  });

  describe('space creation', () => {
    it('should track the open event with creation intent', async () => {
      await build();

      expect(Analytics.track).toBeCalledWith(
        `space_wizard:${utils.WIZARD_EVENTS.OPEN}`,
        expect.objectContaining({
          intendedAction: utils.WIZARD_INTENT.CREATE,
        })
      );
    });

    it('should show the POC space creation wizard if the base plan is enterprise', async () => {
      await build();

      expect(screen.queryByTestId('enterprise-wizard-contents')).toBeVisible();
    });

    it('should show the on-demand space creation wizard if the base plan is not enterprise', async () => {
      const mockOnDemandBasePlan = Fake.Plan({ customerType: PricingDataProvider.SELF_SERVICE });
      when(mockOrganizationEndpoint)
        .calledWith(expect.objectContaining({ path: ['plans'] }))
        .mockResolvedValue({ items: [mockOnDemandBasePlan] });

      await build();

      expect(screen.queryByTestId('create-on-demand-wizard-contents')).toBeVisible();
    });
  });

  describe('space plan change', () => {
    it('should track the open event with creation intent', async () => {
      await build({ space: mockSpace });

      expect(Analytics.track).toBeCalledWith(
        `space_wizard:${utils.WIZARD_EVENTS.OPEN}`,
        expect.objectContaining({
          intendedAction: utils.WIZARD_INTENT.CHANGE,
        })
      );
    });

    it('should show the on-demand space change wizard if a space is provided', async () => {
      await build({ space: mockSpace });

      expect(screen.queryByTestId('change-on-demand-wizard-contents')).toBeVisible();
    });
  });
});

async function build(custom, shouldWait = true) {
  const props = Object.assign(
    {
      isShown: true,
      onClose: () => {},
      organization: mockOrganization,
      space: null,
    },
    custom
  );

  render(<SpaceWizardsWrapper {...props} />);

  if (shouldWait) {
    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));
  }
}
