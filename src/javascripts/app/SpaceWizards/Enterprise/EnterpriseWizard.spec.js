import React from 'react';
import { render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { when } from 'jest-when';
import { getTemplatesList, getTemplate } from 'services/SpaceTemplateLoader';
import * as utils from '../shared/utils';
import * as Fake from 'test/helpers/fakeFactory';

import EnterpriseWizard from './EnterpriseWizard';

import { freeSpace } from '../__tests__/fixtures/plans';
import { mockOrganizationEndpoint as mockEndpoint } from 'data/EndpointFactory';

const mockOrganization = Fake.Organization();
const mockSpace = Fake.Space();
const mockFreeSpaceResource = Fake.SpaceResource(1, 5, 'free_space');
const mockTemplate = {
  name: 'Awesome template',
  sys: {
    id: 'template_1234',
  },
};

mockEndpoint.mockRejectedValue();
when(mockEndpoint)
  .calledWith(expect.objectContaining({ path: ['product_rate_plans'] }))
  .mockResolvedValue({ items: [freeSpace] })
  .calledWith(expect.objectContaining({ path: ['plans'] }))
  .mockResolvedValue({ items: [] })
  .calledWith(expect.objectContaining({ path: [] }))
  .mockResolvedValue()
  .calledWith(expect.objectContaining({ path: ['resources'] }))
  .mockResolvedValue({ items: [mockFreeSpaceResource] });

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

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

describe('Enterprise Wizard', () => {
  beforeEach(() => {
    getTemplatesList.mockResolvedValue([mockTemplate]);
    getTemplate.mockResolvedValue(mockTemplate);
    mockCreateSpace.mockResolvedValue(mockSpace);

    window.open = jest.fn();
  });

  it('should show a loading spinner when fetching initial data', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
  });

  it('should show the POC plan', async () => {
    await build();
    expect(screen.queryByTestId('space-plans-list.item')).toBeVisible();
  });

  it('should hide the create button and show the contact us and close buttons if the user is at their free space limit', async () => {
    when(mockEndpoint)
      .calledWith(expect.objectContaining({ path: ['resources'] }))
      .mockResolvedValueOnce({ items: [Fake.SpaceResource(1, 1, 'free_space')] });

    await build();

    expect(screen.queryByTestId('create-space-button')).toBeNull();
    expect(screen.queryByTestId('cf-contact-us-button')).toBeVisible();
    expect(screen.queryByTestId('close-wizard')).toBeVisible();
  });

  it('should call onClose when the contact us button is clicked', async () => {
    when(mockEndpoint)
      .calledWith(expect.objectContaining({ path: ['resources'] }))
      .mockResolvedValueOnce({ items: [Fake.SpaceResource(1, 1, 'free_space')] });

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
    when(mockEndpoint)
      .calledWith(expect.objectContaining({ path: ['resources'] }))
      .mockResolvedValueOnce({ items: [Fake.SpaceResource(1, 1, 'free_space')] });
    await build();

    expect(screen.queryByTestId('reached-limit-note')).toBeVisible();
  });

  it('should show the not enabled note if the limit is zero', async () => {
    when(mockEndpoint)
      .calledWith(expect.objectContaining({ path: ['resources'] }))
      .mockResolvedValueOnce({ items: [Fake.SpaceResource(1, 0, 'free_space')] });
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

    await waitFor(() => {
      expect(onProcessing).toHaveBeenNthCalledWith(1, true);
    });
  });

  it('should create a space without a template and call onClose if no template is selected', async () => {
    const onClose = jest.fn();

    await build({ onClose });

    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'my space name'
    );

    userEvent.click(screen.queryByTestId('create-space-button'));

    expect(utils.createSpace).toHaveBeenCalledWith({
      name: 'my space name',
      plan: freeSpace,
      organizationId: mockOrganization.sys.id,
    });

    await waitFor(() => {
      expect(onClose).toBeCalled();
    });
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

    expect(utils.createSpaceWithTemplate).toHaveBeenCalledWith({
      name: 'my space name',
      template: mockTemplate,
      plan: freeSpace,
      organizationId: mockOrganization.sys.id,
      onTemplateCreationStarted: expect.any(Function),
    });

    await waitFor(() => {
      expect(onProcessing).toHaveBeenNthCalledWith(2, false);
    });
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

    utils.createSpaceWithTemplate.mockImplementationOnce(async ({ onTemplateCreationStarted }) => {
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

    await waitFor(() => {
      expect(screen.queryByTestId('create-template-progress')).toBeNull();
    });

    spaceCreationCompleted();
    await waitFor(() => {
      expect(screen.queryByTestId('create-template-progress')).toBeVisible();
    });
    templateCreationCompleted();
    await waitFor(() => {
      expect(onProcessing).toBeCalled();
    });
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
    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));
  }
}
