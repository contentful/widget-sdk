import React from 'react';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { when } from 'jest-when';
import * as PricingDataProvider from 'account/pricing/PricingDataProvider';
import SpaceWizardsWrapper from './SpaceWizardsWrapper';
import * as Fake from 'test/helpers/fakeFactory';
import { freeSpace, mediumSpaceCurrent } from './__tests__/fixtures/plans';
import { mockEndpoint } from 'data/EndpointFactory';

const mockOrganization = Fake.Organization({
  isBillable: true,
});
const mockSpace = Fake.Space();

const mockBasePlan = Fake.Plan({ customerType: PricingDataProvider.ENTERPRISE });
const mockFreeSpaceResource = Fake.OrganizationResource(1, 5, 'free_space');
const mockSpaceResources = [Fake.SpaceResource(1, 3, 'environment')];

mockEndpoint.mockRejectedValue();
when(mockEndpoint)
  .calledWith(expect.objectContaining({ path: ['product_rate_plans'] }))
  .mockResolvedValue({ items: [freeSpace] })
  .calledWith(expect.objectContaining({ path: ['plans'] }))
  .mockResolvedValue({ items: [mockBasePlan] })
  .calledWith(expect.objectContaining({ path: ['resources', 'free_space'] }))
  .mockResolvedValue(mockFreeSpaceResource)
  .calledWith(expect.objectContaining({ path: ['resources'] }))
  .mockResolvedValue(mockSpaceResources);

jest.mock('services/SpaceTemplateLoader', () => ({
  getTemplatesList: jest.fn().mockResolvedValue([]),
}));

jest.spyOn(PricingDataProvider, 'getBasePlan');
jest.spyOn(PricingDataProvider, 'isEnterprisePlan');

describe('SpaceWizardsWrapper', () => {
  it('should always get the base plan and determine if the plan is enterprise', async () => {
    await build();

    expect(PricingDataProvider.getBasePlan).toBeCalled();
    expect(PricingDataProvider.isEnterprisePlan).toBeCalled();
  });

  it('should show the loading spinner while the data is being fetched', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
  });

  describe('space creation', () => {
    it('should show the POC space creation wizard if the base plan is enterprise', async () => {
      await build();

      expect(screen.queryByTestId('enterprise-wizard-contents')).toBeVisible();
    });

    it('should show the on-demand space creation wizard if the base plan is not enterprise', async () => {
      const mockOnDemandBasePlan = Fake.Plan({ customerType: PricingDataProvider.SELF_SERVICE });
      when(mockEndpoint)
        .calledWith(expect.objectContaining({ path: ['plans'] }))
        .mockResolvedValue({ items: [mockOnDemandBasePlan] });

      await build();

      expect(screen.queryByTestId('create-on-demand-wizard-contents')).toBeVisible();
    });
  });

  describe('space plan change', () => {
    beforeEach(() => {
      when(mockEndpoint)
        .calledWith(expect.objectContaining({ path: ['product_rate_plans'] }))
        .mockResolvedValue({ items: [mediumSpaceCurrent] });
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
