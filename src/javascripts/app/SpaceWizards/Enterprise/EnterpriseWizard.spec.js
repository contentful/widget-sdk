import React from 'react';
import { render, screen, wait, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSpaceRatePlans, isHighDemandEnterprisePlan } from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import { createSpace, createSpaceWithTemplate } from '../shared/utils';
import * as FakeFactory from 'test/helpers/fakeFactory';

import EnterpriseWizard from './EnterpriseWizard';

const mockOrganization = FakeFactory.Organization();
const mockTemplate = {
  name: 'Awesome template',
  sys: {
    id: 'template_1234',
  },
};

const mockRatePlanCharges = [
  {
    name: 'Environments',
    tiers: [{ endingUnit: 10 }],
  },
  {
    name: 'Roles',
    tiers: [{ endingUnit: 10 }],
  },
  {
    name: 'Locales',
    tiers: [{ endingUnit: 10 }],
  },
  {
    name: 'Content types',
    tiers: [{ endingUnit: 10 }],
  },
  {
    name: 'Records',
    tiers: [{ endingUnit: 10 }],
  },
];

const mockFreeSpaceRatePlan = {
  productPlanType: 'free_space',
  productRatePlanCharges: mockRatePlanCharges,
  name: 'Enterprise Space',
  roleSet: {
    name: 'lol',
    roles: ['Wizard'],
  },
};

jest.mock('../shared/utils', () => ({
  getIncludedResources: jest.fn().mockReturnValue([]),
  createSpace: jest.fn().mockResolvedValue(),
  createSpaceWithTemplate: jest.fn().mockResolvedValue(),
  FREE_SPACE_IDENTIFIER: 'free_space',
}));

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  isHighDemandEnterprisePlan: jest.fn().mockReturnValue(false),
  getSpaceRatePlans: jest.fn(),
}));

jest.mock('services/SpaceTemplateLoader', () => ({
  getTemplatesList: jest.fn(),
}));

jest.mock('services/ResourceService', () => {
  const service = {
    get: jest.fn((type) => {
      if (type === 'free_space') {
        return {
          usage: 1,
          limits: {
            maximum: 5,
          },
        };
      }
    }),
  };

  return () => service;
});

describe('Enterprise Wizard', () => {
  beforeEach(() => {
    getSpaceRatePlans.mockResolvedValue([mockFreeSpaceRatePlan]);
    getTemplatesList.mockResolvedValue([mockTemplate]);

    window.open = jest.fn();
  });

  it('should show a loader while the initial data is fetching', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await wait();

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
  });

  it('should fetch the free space resource, space rate plans, and templates initially', async () => {
    const service = createResourceService();

    await build();

    expect(getSpaceRatePlans).toBeCalled();
    expect(service.get).toBeCalledWith('free_space');
    expect(getTemplatesList).toBeCalled();
  });

  it('should show the POC plan', async () => {
    await build();
    expect(screen.queryByTestId('space-plans-list.item')).toBeVisible();
  });

  it('should display a disclaimer about POC spaces if the plan is not "High Demand"', async () => {
    await build();
    expect(screen.queryByTestId('enterprise-space-wizard.info')).toBeVisible();
  });

  it('should not display a disclaimer about POC spaces if the plan is "High Demand"', async () => {
    isHighDemandEnterprisePlan.mockReturnValue(true);

    await build();
    expect(screen.queryByTestId('enterprise-space-wizard.info')).toBeNull();
  });

  it('should hide the create button and show the contact us and close buttons if the user is at their free space limit', async () => {
    const service = createResourceService();
    service.get.mockResolvedValueOnce({
      usage: 1,
      limits: {
        maximum: 1,
      },
    });

    await build();

    expect(screen.queryByTestId('create-space-button')).toBeNull();
    expect(screen.queryByTestId('cf-contact-us-button')).toBeVisible();
    expect(screen.queryByTestId('close-wizard')).toBeVisible();
  });

  it('should call onClose when the contact us button is clicked', async () => {
    const service = createResourceService();
    service.get.mockResolvedValueOnce({
      usage: 1,
      limits: {
        maximum: 1,
      },
    });

    const onClose = jest.fn();

    await build({ onClose });

    userEvent.click(screen.queryByTestId('cf-contact-us-button'));

    expect(onClose).toBeCalled();
  });

  it('should enable the create button once the user has typed a space name', async () => {
    await build();

    expect(screen.queryByTestId('create-space-button')).toHaveAttribute('disabled');

    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'my space name'
    );

    expect(screen.queryByTestId('create-space-button')).not.toHaveAttribute('disabled');
  });

  it('should not show the close icon in the modal header if isProcessing is true', async () => {
    await build({ isProcessing: true });

    expect(
      within(screen.getByTestId('cf-ui-modal-header')).queryByTestId('cf-ui-icon-button')
    ).toBeNull();
  });

  it('should show the reached limit note if the limit is reached', async () => {
    const service = createResourceService();
    service.get.mockResolvedValueOnce({
      usage: 1,
      limits: {
        maximum: 1,
      },
    });

    await build();

    expect(screen.queryByTestId('reached-limit-note')).toBeVisible();
  });

  it('should show the not enabled note if the limit is zero', async () => {
    const service = createResourceService();
    service.get.mockResolvedValueOnce({
      usage: 1,
      limits: {
        maximum: 0,
      },
    });

    await build();

    expect(screen.queryByTestId('poc-not-enabled-note')).toBeVisible();
  });

  it('should call onProcessing with true when the space creation begins', async () => {
    const onProcessing = jest.fn();

    await build({ onProcessing });

    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'my space name'
    );

    userEvent.click(screen.queryByTestId('create-space-button'));

    expect(onProcessing).toHaveBeenNthCalledWith(1, true);

    await wait();
  });

  it('should create a space without a template and call onClose if no template is selected', async () => {
    const onClose = jest.fn();

    await build({ onClose });

    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'my space name'
    );

    userEvent.click(screen.queryByTestId('create-space-button'));

    await wait();

    expect(createSpace).toHaveBeenCalledWith({
      name: 'my space name',
      plan: mockFreeSpaceRatePlan,
      organizationId: mockOrganization.sys.id,
    });

    expect(onClose).toBeCalled();
  });

  it('should create a space with a template if a template is selected', async () => {
    const onProcessing = jest.fn();

    await build({ onProcessing });

    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'my space name'
    );

    userEvent.click(
      within(screen.getByTestId('template-toggle-true')).getByTestId('cf-ui-controlled-input')
    );
    userEvent.click(screen.getByTestId('create-space-button'));

    await wait();

    expect(createSpaceWithTemplate).toHaveBeenCalledWith({
      name: 'my space name',
      template: mockTemplate,
      plan: mockFreeSpaceRatePlan,
      organizationId: mockOrganization.sys.id,
      onTemplateCreationStarted: expect.any(Function),
    });

    expect(onProcessing).toHaveBeenNthCalledWith(2, false);

    await wait();
  });

  it('should show the progress screen when creating a space with a template, when the template is being created', async () => {
    // Setup the space and template creation promises
    //
    // In the mocked implementation of `createSpaceWithTemplate`, we want to be able to
    // control when it called `onTemplateCreationStarted`` procedurally. To do this, we set
    // the value each promises `resolve` to something we can call at a later point, and
    // assert in between the different resolutions.
    let spaceCreationCompleted;
    const spaceCreationPromise = new Promise((resolve) => {
      spaceCreationCompleted = resolve;
    });

    let templateCreationCompleted;
    const templateCreationPromise = new Promise((resolve) => {
      templateCreationCompleted = resolve;
    });

    createSpaceWithTemplate.mockImplementation(async ({ onTemplateCreationStarted }) => {
      await spaceCreationPromise;

      onTemplateCreationStarted();

      await templateCreationPromise;
    });

    const onProcessing = jest.fn();

    await build({ onProcessing });

    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'my space name'
    );

    userEvent.click(
      within(screen.getByTestId('template-toggle-true')).getByTestId('cf-ui-controlled-input')
    );
    userEvent.click(screen.getByTestId('create-space-button'));

    await wait();

    expect(screen.queryByTestId('create-template-progress')).toBeNull();

    spaceCreationCompleted();
    await wait();

    expect(screen.queryByTestId('create-template-progress')).toBeVisible();

    templateCreationCompleted();
    await wait();

    expect(onProcessing).toBeCalled();

    await wait();
  });
});

async function build(custom = {}, shouldWait = true) {
  const props = Object.assign(
    {
      isProcessing: false,
      onProcessing: () => {},
      onClose: () => {},
      basePlan: {},
      organization: mockOrganization,
    },
    custom
  );

  render(<EnterpriseWizard {...props} />);

  if (shouldWait) {
    await wait();
  }
}
