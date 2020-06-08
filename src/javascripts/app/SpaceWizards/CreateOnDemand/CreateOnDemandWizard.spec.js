import React from 'react';
import { render, screen, within, wait, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import cleanupNotifications from 'test/helpers/cleanupNotifications';
import createResourceService from 'services/ResourceService';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import {
  getSpaceRatePlans,
  getSubscriptionPlans,
  calculateTotalPrice,
} from 'account/pricing/PricingDataProvider';
import {
  transformSpaceRatePlans,
  createSpace,
  createSpaceWithTemplate,
  sendParnershipEmail,
} from '../shared/utils';

import CreateOnDemandWizard from './CreateOnDemandWizard';

const mockSpace = Fake.Space();
const mockOrganization = Fake.Organization();
const mockPlan = Fake.Plan({
  productPlanType: 'free_space',
  productRatePlanCharges: [
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
  ],
  name: 'Enterprise Space',
  roleSet: {
    name: 'lol',
    roles: ['Wizard'],
  },
});

const mockTransformedPlan = {
  current: false,
  disabled: false,
  includedResources: mockPlan.productRatePlanCharges.map(({ name, tiers }) => ({
    type: name,
    number: tiers[0].endingUnit,
  })),
  isFree: true,
  ...mockPlan,
};

const mockFreeSpaceResource = {
  usage: 1,
  limits: {
    maximum: 5,
  },
};

const mockTemplate = {
  name: 'My template',
  sys: {
    id: 'template_1234',
  },
};

jest.mock('../shared/utils', () => ({
  getIncludedResources: jest.fn().mockReturnValue([]),
  createSpace: jest.fn().mockResolvedValue(),
  createSpaceWithTemplate: jest.fn().mockResolvedValue(),
  FREE_SPACE_IDENTIFIER: 'free_space',
  transformSpaceRatePlans: jest.fn(),
  getHighestPlan: jest.fn(),
  SpaceResourceTypes: {
    Roles: 'Role',
  },
  getTooltip: jest.fn().mockReturnValue(null),
  getRolesTooltip: jest.fn().mockReturnValue(null),
  sendParnershipEmail: jest.fn().mockResolvedValue(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  getSpaceRatePlans: jest.fn(),
  getSubscriptionPlans: jest.fn().mockResolvedValue({ items: [] }),
  calculateTotalPrice: jest.fn().mockReturnValue(0),
}));

jest.mock('services/SpaceTemplateLoader', () => ({
  getTemplatesList: jest.fn(),
}));

jest.mock('services/ResourceService', () => {
  const service = {
    get: jest.fn((type) => {
      if (type === 'free_space') {
        return mockFreeSpaceResource;
      }
    }),
  };

  return () => service;
});

jest.useFakeTimers();

describe('CreateOnDemandWizard', () => {
  beforeEach(() => {
    createSpace.mockResolvedValue(mockSpace);
    createSpaceWithTemplate.mockResolvedValue(mockSpace);
    getSpaceRatePlans.mockResolvedValue([mockPlan]);
    transformSpaceRatePlans.mockReturnValue([mockTransformedPlan]);
    getTemplatesList.mockResolvedValue([mockTemplate]);
  });

  afterEach(cleanupNotifications);

  it('should show a loading spinner when fetching', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
  });

  it('should get all the data when loading', async () => {
    const resourceService = createResourceService();

    await build();

    expect(resourceService.get).toBeCalledWith('free_space');
    expect(getTemplatesList).toBeCalled();
    expect(getSpaceRatePlans).toBeCalledWith(expect.any(Function));
    expect(getSubscriptionPlans).toBeCalledWith(expect.any(Function));

    expect(transformSpaceRatePlans).toBeCalledWith({
      organization: mockOrganization,
      spaceRatePlans: [mockPlan],
      freeSpaceResource: mockFreeSpaceResource,
    });
    expect(calculateTotalPrice).toBeCalled();
  });

  it('should call onClose if the close button is clicked', async () => {
    const onClose = jest.fn();

    await build({ onClose });

    userEvent.click(screen.getByTestId('close-icon'));

    expect(onClose).toBeCalled();
  });

  it('should show the space plan selection tab initially and disable the 2nd/3rd tabs', async () => {
    await build();

    expect(screen.getByTestId('space-plan-selector')).toBeVisible();
    expect(screen.getByTestId('space-details-tab')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('confirmation-tab')).toHaveAttribute('aria-disabled', 'true');
  });

  it('should show the space details tab when a space plan is selected', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('space-plan-item')[0]);

    expect(screen.getByTestId('space-details')).toBeVisible();
  });

  it('should show the confirmation screen when the space details are input', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('space-plan-item')[0]);
    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'A space name'
    );
    userEvent.click(screen.getByTestId('go-to-confirmation-button'));

    expect(screen.getByTestId('confirmation-contents')).toBeVisible();
  });

  it('should allow for navigating between screens using the tabs', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('space-plan-item')[0]);
    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'A space name'
    );
    userEvent.click(screen.getByTestId('go-to-confirmation-button'));

    expect(screen.getByTestId('confirmation-contents')).toBeVisible();

    userEvent.click(screen.getByTestId('space-plan-selector-tab'));

    expect(screen.getByTestId('space-plan-selector')).toBeVisible();

    userEvent.click(screen.getByTestId('space-details-tab'));

    expect(screen.getByTestId('space-details')).toBeVisible();
  });

  describe('creating a non-templated space', () => {
    const beginCreatingSpace = async (buildProps) => {
      await build(buildProps);

      userEvent.click(screen.getAllByTestId('space-plan-item')[0]);
      userEvent.type(
        within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
        'A space name'
      );
      userEvent.click(screen.getByTestId('go-to-confirmation-button'));
      userEvent.click(screen.getByTestId('confirm-button'));
    };

    it('should hide the close button and call onProcessing with true when creating a space', async () => {
      const onProcessing = jest.fn();
      await beginCreatingSpace({ onProcessing });

      expect(screen.queryByTestId('close-icon')).toBeNull();
      expect(onProcessing).toBeCalledWith(true);

      await wait();
    });

    it('should attempt to create a space without a template if no template is selected during the flow', async () => {
      await beginCreatingSpace();

      expect(createSpace).toBeCalledWith({
        name: 'A space name',
        plan: mockTransformedPlan,
        organizationId: mockOrganization.sys.id,
      });

      await wait();
    });

    it('should close itself once the non-templated space is successfully created', async () => {
      const onClose = jest.fn();
      await beginCreatingSpace({ onClose });

      await wait();

      expect(onClose).toBeCalled();
    });

    it('should show an error notification and not close if the space creation process fails', async () => {
      createSpace.mockRejectedValueOnce(new Error('oops'));

      const onProcessing = jest.fn();
      const onClose = jest.fn();
      await beginCreatingSpace({ onClose, onProcessing });

      await wait();

      expect(onClose).not.toBeCalled();
      expect(onProcessing).toBeCalledWith(false);
      expect(await screen.findByTestId('cf-ui-notification')).toHaveAttribute(
        'data-intent',
        'error'
      );
    });
  });

  describe('creating a templated space', () => {
    const beginCreatingSpace = async (buildProps) => {
      await build(buildProps);

      userEvent.click(screen.getAllByTestId('space-plan-item')[0]);
      userEvent.type(
        within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
        'A templated space name'
      );

      // When clicking the "true" toggle, the first template is selected automatically
      userEvent.click(
        within(screen.getByTestId('template-toggle-true')).getByTestId('cf-ui-controlled-input')
      );
      userEvent.click(screen.getByTestId('go-to-confirmation-button'));
      userEvent.click(screen.getByTestId('confirm-button'));
    };

    it('should hide the close button and call onProcessing with true when creating a space', async () => {
      const onProcessing = jest.fn();
      await beginCreatingSpace({ onProcessing });

      expect(screen.queryByTestId('close-icon')).toBeNull();
      expect(onProcessing).toBeCalledWith(true);

      await wait();
    });

    it('should attempt to create a templated space if a template is selected during the flow', async () => {
      await beginCreatingSpace();

      expect(createSpaceWithTemplate).toBeCalledWith({
        name: 'A templated space name',
        plan: mockTransformedPlan,
        template: mockTemplate,
        organizationId: mockOrganization.sys.id,
        onTemplateCreationStarted: expect.any(Function),
      });

      await wait();
    });

    it('should show the progress screen once the space is created and the template is being created', async () => {
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

      const onClose = jest.fn();

      await beginCreatingSpace({ onClose });

      await wait();

      expect(screen.queryByTestId('create-template-progress')).toBeNull();

      spaceCreationCompleted();
      await wait();

      expect(screen.queryByTestId('create-template-progress')).toBeVisible();

      templateCreationCompleted();
      await wait();

      userEvent.click(screen.getByTestId('get-started-button'));

      expect(onClose).toBeCalled();
    });

    it('should call onProcessing with false once the template is created', async () => {
      const onProcessing = jest.fn();

      await beginCreatingSpace({ onProcessing });

      await wait();

      expect(onProcessing).toBeCalledWith(false);
    });

    it('should show an error notification if the space creation process fails', async () => {
      createSpaceWithTemplate.mockRejectedValueOnce(new Error('oops'));

      const onProcessing = jest.fn();
      await beginCreatingSpace({ onProcessing });

      await wait();

      expect(onProcessing).toBeCalledWith(false);
      expect(await screen.findByTestId('cf-ui-notification')).toHaveAttribute(
        'data-intent',
        'error'
      );
    });
  });

  describe('partner plans', () => {
    const mockPartnerSpacePlan = Object.assign({}, mockTransformedPlan, {
      productPlanType: 'space',
      productType: 'partner',
    });

    const beginCreatingSpace = async (buildProps) => {
      await build(buildProps);

      userEvent.click(screen.getAllByTestId('space-plan-item')[0]);
      userEvent.type(
        within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
        'A templated space name'
      );

      userEvent.click(screen.getByTestId('go-to-confirmation-button'));

      expect(screen.getByTestId('confirm-button')).toHaveAttribute('disabled');

      userEvent.type(
        within(screen.getByTestId('client-name')).getByTestId('cf-ui-text-input'),
        'Cyberdyne Systems'
      );
      userEvent.type(
        within(screen.getByTestId('description')).getByTestId('cf-ui-text-input'),
        'Skynet'
      );

      expect(screen.getByTestId('confirm-button')).not.toHaveAttribute('disabled');

      userEvent.click(screen.getByTestId('confirm-button'));
    };

    beforeEach(() => {
      transformSpaceRatePlans.mockReturnValueOnce([mockPartnerSpacePlan]);
    });

    it('should require the client name and project description before submitting, and call sendParnershipEmail with the details on submission', async () => {
      const onClose = jest.fn();

      await beginCreatingSpace({ onClose });
      await wait();

      expect(sendParnershipEmail).toBeCalledWith(mockSpace.sys.id, {
        clientName: 'Cyberdyne Systems',
        projectDescription: 'Skynet',
        estimatedDeliveryDate: expect.any(String),
      });
      expect(onClose).toBeCalled();
    });

    it('should not care if sendParnershipEmail throws', async () => {
      sendParnershipEmail.mockRejectedValueOnce(new Error('oops'));

      const onClose = jest.fn();
      await beginCreatingSpace({ onClose });
      await wait();

      expect(sendParnershipEmail).toBeCalled();
      expect(onClose).toBeCalled();
    });
  });
});

async function build(custom, shouldWait = true) {
  const props = Object.assign(
    {
      organization: mockOrganization,
      onClose: () => {},
      onProcessing: () => {},
    },
    custom
  );

  render(<CreateOnDemandWizard {...props} />);

  if (shouldWait) {
    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));
  }
}
