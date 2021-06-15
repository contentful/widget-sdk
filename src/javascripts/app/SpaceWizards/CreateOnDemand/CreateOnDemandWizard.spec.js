import React from 'react';
import { render, screen, within, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { when } from 'jest-when';
import * as Fake from 'test/helpers/fakeFactory';
import cleanupNotifications from 'test/helpers/cleanupNotifications';
import * as utils from '../shared/utils';
import { getTemplatesList, getTemplate } from 'services/SpaceTemplateLoader';
import * as Analytics from 'analytics/Analytics';
import CreateOnDemandWizard from './CreateOnDemandWizard';

import { freeSpace } from '../__tests__/fixtures/plans';
import { mockOrganizationEndpoint, mockSpaceEndpoint } from 'data/EndpointFactory';

const mockSpace = Fake.Space();
const mockOrganization = Fake.Organization({ isBillable: true });
const mockFreeSpaceResource = Fake.SpaceResource(1, 5, 'free_space');
const mockTemplate = {
  name: 'My template',
  sys: {
    id: 'template_1234',
  },
};
const mockWizardSessionId = 'session_id_1234';

when(mockOrganizationEndpoint)
  .calledWith(expect.objectContaining({ path: ['product_rate_plans'] }))
  .mockResolvedValue({ items: [freeSpace] })
  .calledWith(expect.objectContaining({ path: ['plans'] }))
  .mockResolvedValue({ items: [] })
  .calledWith(expect.objectContaining({ path: ['resources', 'free_space'] }))
  .mockResolvedValue(mockFreeSpaceResource);
when(mockSpaceEndpoint)
  .calledWith(expect.objectContaining({ path: [] }))
  .mockResolvedValue();

jest.mock('services/SpaceTemplateLoader', () => ({
  getTemplatesList: jest.fn(),
  getTemplate: jest.fn(),
}));

jest.mock('services/SpaceTemplateCreator', () => {
  const creator = {
    create: jest.fn().mockReturnValue({
      spaceSetup: Promise.resolve(),
      contentCreated: Promise.resolve(),
    }),
  };

  return {
    getCreator: () => creator,
  };
});

const mockCreateSpace = jest.fn();

jest.mock('core/services/usePlainCMAClient', () => ({
  getCMAClient: () => ({
    space: {
      create: mockCreateSpace,
    },
  }),
}));

jest.mock('services/TokenStore', () => ({
  refresh: jest.fn().mockResolvedValue(),
}));

jest.mock('features/api-keys-management', () => ({
  createApiKeyRepo: () => {
    const repo = {
      create: jest.fn().mockResolvedValue(),
    };

    return repo;
  },
}));

jest.spyOn(utils, 'createSpace');
jest.spyOn(utils, 'createSpaceWithTemplate');
jest.spyOn(utils, 'sendParnershipEmail');

jest.useFakeTimers();

describe('CreateOnDemandWizard', () => {
  beforeEach(() => {
    mockCreateSpace.mockResolvedValue(mockSpace);
    getTemplatesList.mockResolvedValue([mockTemplate]);
    getTemplate.mockResolvedValue(mockTemplate);
  });

  afterEach(cleanupNotifications);

  it('should show a loading spinner when fetching', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
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

  it('should track when a space plan in selected', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('space-plan-item')[0]);

    expect(Analytics.track).toBeCalledWith(
      `space_wizard:${utils.WIZARD_EVENTS.SELECT_PLAN}`,
      expect.objectContaining({
        intendedAction: utils.WIZARD_INTENT.CREATE,
        currentSpaceType: null,
        targetSpaceType: freeSpace.internalName,
        recommendedSpaceType: null,
      })
    );
  });

  it('should show the confirmation screen when the space details are entered', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('space-plan-item')[0]);
    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'A space name'
    );
    userEvent.click(screen.getByTestId('go-to-confirmation-button'));

    expect(screen.getByTestId('confirmation-contents')).toBeVisible();
  });

  it('should track when the space details are entered', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('space-plan-item')[0]);
    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'A space name'
    );
    userEvent.click(screen.getByTestId('go-to-confirmation-button'));

    expect(Analytics.track).toBeCalledWith(
      `space_wizard:${utils.WIZARD_EVENTS.ENTERED_DETAILS}`,
      expect.objectContaining({
        intendedAction: utils.WIZARD_INTENT.CREATE,
        targetSpaceName: 'A space name',
        targetSpaceTemplateId: null,
      })
    );
  });

  it('should track when space name and space template is selected', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('space-plan-item')[0]);
    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'A space name'
    );
    userEvent.click(
      within(screen.getByTestId('template-toggle-true')).getByTestId('cf-ui-controlled-input')
    );
    userEvent.click(screen.getByTestId('go-to-confirmation-button'));

    expect(Analytics.track).toBeCalledWith(
      `space_wizard:${utils.WIZARD_EVENTS.ENTERED_DETAILS}`,
      expect.objectContaining({
        intendedAction: utils.WIZARD_INTENT.CREATE,
        targetSpaceName: 'A space name',
        targetSpaceTemplateId: mockTemplate.name,
      })
    );
  });

  it('should allow for navigating between screens using the tabs and track the navigation events', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('space-plan-item')[0]);

    // The first event is WIZARD_EVENTS.SELECT_PLAN
    expect(Analytics.track).toHaveBeenNthCalledWith(
      2,
      `space_wizard:${utils.WIZARD_EVENTS.NAVIGATE}`,
      expect.objectContaining({
        currentStep: 'spacePlanSelector',
        targetStep: 'spaceDetails',
      })
    );

    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'A space name'
    );
    userEvent.click(screen.getByTestId('go-to-confirmation-button'));

    // The third event is WIZARD_EVENTS.ENTERED_DETAILS
    expect(Analytics.track).toHaveBeenNthCalledWith(
      4,
      `space_wizard:${utils.WIZARD_EVENTS.NAVIGATE}`,
      expect.objectContaining({
        currentStep: 'spaceDetails',
        targetStep: 'confirmation',
      })
    );

    expect(screen.getByTestId('confirmation-contents')).toBeVisible();

    userEvent.click(screen.getByTestId('space-plan-selector-tab'));

    expect(Analytics.track).toHaveBeenNthCalledWith(
      5,
      `space_wizard:${utils.WIZARD_EVENTS.NAVIGATE}`,
      expect.objectContaining({
        currentStep: 'confirmation',
        targetStep: 'spacePlanSelector',
      })
    );

    expect(screen.getByTestId('space-plan-selector')).toBeVisible();

    userEvent.click(screen.getByTestId('space-details-tab'));

    expect(Analytics.track).toHaveBeenNthCalledWith(
      6,
      `space_wizard:${utils.WIZARD_EVENTS.NAVIGATE}`,
      expect.objectContaining({
        currentStep: 'spacePlanSelector',
        targetStep: 'spaceDetails',
      })
    );

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

    it('should track the confirm analytics event', async () => {
      await beginCreatingSpace();

      await waitFor(() =>
        expect(Analytics.track).toBeCalledWith(
          `space_wizard:${utils.WIZARD_EVENTS.CONFIRM}`,
          expect.objectContaining({
            intendedAction: utils.WIZARD_INTENT.CREATE,
          })
        )
      );
    });

    it('should hide the close button and call onProcessing with true when creating a space', async () => {
      const onProcessing = jest.fn();
      await beginCreatingSpace({ onProcessing });

      expect(screen.queryByTestId('close-icon')).toBeNull();

      await waitFor(() => {
        expect(onProcessing).toBeCalledWith(true);
      });
    });

    it('should attempt to create a space without a template if no template is selected during the flow', async () => {
      await beginCreatingSpace();

      await waitFor(() => {
        expect(utils.createSpace).toBeCalledWith({
          name: 'A space name',
          plan: expect.objectContaining(freeSpace),
          organizationId: mockOrganization.sys.id,
          sessionId: mockWizardSessionId,
        });
      });
    });

    it('should close itself once the non-templated space is successfully created', async () => {
      const onClose = jest.fn();
      await beginCreatingSpace({ onClose });

      await waitFor(() => expect(onClose).toBeCalled());
    });

    it('should show an error notification and not close if the space creation process fails', async () => {
      mockCreateSpace.mockRejectedValueOnce();

      const onProcessing = jest.fn();
      const onClose = jest.fn();
      await beginCreatingSpace({ onClose, onProcessing });

      await waitFor(() => screen.getByTestId('cf-ui-notification'));

      expect(onClose).not.toBeCalled();
      expect(onProcessing).toBeCalledWith(false);
      expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
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

    it('should track the confirm analytics event', async () => {
      await beginCreatingSpace();

      await waitFor(() =>
        expect(Analytics.track).toBeCalledWith(
          `space_wizard:${utils.WIZARD_EVENTS.CONFIRM}`,
          expect.objectContaining({
            intendedAction: utils.WIZARD_INTENT.CREATE,
          })
        )
      );
    });

    it('should hide the close button and call onProcessing with true when creating a space', async () => {
      const onProcessing = jest.fn();
      await beginCreatingSpace({ onProcessing });

      expect(screen.queryByTestId('close-icon')).toBeNull();

      await waitFor(() => expect(onProcessing).toBeCalledWith(true));
    });

    it('should attempt to create a templated space if a template is selected during the flow', async () => {
      await beginCreatingSpace();

      await waitFor(() => {
        expect(utils.createSpaceWithTemplate).toBeCalledWith({
          name: 'A templated space name',
          plan: expect.objectContaining(freeSpace),
          template: mockTemplate,
          organizationId: mockOrganization.sys.id,
          sessionId: mockWizardSessionId,
          onTemplateCreationStarted: expect.any(Function),
        });
      });
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

      utils.createSpaceWithTemplate.mockImplementationOnce(
        async ({ onTemplateCreationStarted }) => {
          await spaceCreationPromise;

          onTemplateCreationStarted();

          await templateCreationPromise;
        }
      );

      const onClose = jest.fn();

      await beginCreatingSpace({ onClose });

      await waitFor(() => {
        expect(screen.queryByTestId('create-template-progress')).toBeNull();
      });

      spaceCreationCompleted();

      await waitFor(() => {
        expect(screen.queryByTestId('create-template-progress')).toBeVisible();
      });

      templateCreationCompleted();
      await waitFor(() => {
        expect(screen.getByTestId('get-started-button')).not.toHaveAttribute('disabled');
      });

      userEvent.click(screen.getByTestId('get-started-button'));

      expect(onClose).toBeCalled();
    });

    it('should call onProcessing with false once the template is created', async () => {
      const onProcessing = jest.fn();

      await beginCreatingSpace({ onProcessing });

      await waitFor(() => {
        expect(onProcessing).toBeCalledWith(false);
      });
    });

    it('should show an error notification if the space creation process fails', async () => {
      mockCreateSpace.mockRejectedValueOnce();

      const onProcessing = jest.fn();
      await beginCreatingSpace({ onProcessing });

      await waitFor(() => screen.getByTestId('cf-ui-notification'));

      expect(onProcessing).toBeCalledWith(false);
      expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
    });
  });

  describe('partner plans', () => {
    const mockPartnerSpacePlan = Object.assign({}, freeSpace, {
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
      when(mockOrganizationEndpoint)
        .calledWith(expect.objectContaining({ path: ['product_rate_plans'] }))
        .mockResolvedValueOnce({ items: [mockPartnerSpacePlan] });
    });

    it('should require the client name and project description before submitting, and call sendParnershipEmail with the details on submission', async () => {
      const onClose = jest.fn();

      await beginCreatingSpace({ onClose });
      await waitFor(() => {
        expect(utils.sendParnershipEmail).toBeCalledWith(mockSpace.sys.id, {
          clientName: 'Cyberdyne Systems',
          projectDescription: 'Skynet',
          estimatedDeliveryDate: expect.any(String),
        });
        expect(onClose).toBeCalled();
      });
    });

    it('should not care if sendParnershipEmail throws', async () => {
      when(mockSpaceEndpoint)
        .calledWith(expect.objectContaining({ path: ['partner_projects'] }))
        .mockRejectedValueOnce();

      const onClose = jest.fn();
      await beginCreatingSpace({ onClose });
      await waitFor(() => {
        expect(utils.sendParnershipEmail).toBeCalled();
        expect(onClose).toBeCalled();
      });
    });
  });
});

async function build(custom, shouldWait = true) {
  const props = Object.assign(
    {
      organization: mockOrganization,
      basePlan: {},
      onClose: () => {},
      onProcessing: () => {},
      sessionId: mockWizardSessionId,
    },
    custom
  );

  render(<CreateOnDemandWizard {...props} />);

  if (shouldWait) {
    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));
  }
}
