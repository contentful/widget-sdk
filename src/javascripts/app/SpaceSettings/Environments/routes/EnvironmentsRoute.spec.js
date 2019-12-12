import React from 'react';
import { render, cleanup, waitForElement, wait } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import EnvironmentsRoute from './EnvironmentsRoute';
import * as accessChecker from 'access_control/AccessChecker';
import * as LD from 'utils/LaunchDarkly';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';
import { openDeleteEnvironmentDialog } from '../DeleteDialog';
import createResourceService from 'services/ResourceService';
import { canCreate } from 'utils/ResourceUtils';
import { createPaginationEndpoint } from '__mocks__/data/EndpointFactory';

jest.mock('services/ResourceService', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ usage: 0, limits: { maximum: 3 } })
  })
}));

jest.mock('services/PubSubService', () => ({
  createPubSubClientForSpace: jest.fn().mockReturnValue({
    on: jest.fn(),
    off: jest.fn()
  })
}));

jest.mock('access_control/AccessChecker', () => ({
  can: jest.fn().mockReturnValue(true)
}));

jest.mock('utils/LaunchDarkly', () => ({
  getCurrentVariation: jest.fn().mockResolvedValue(true) // environmentsEnabled
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  getOrgFeature: jest.fn().mockResolvedValue(true), // canSelectSource
  getSpaceFeature: jest.fn().mockResolvedValue(true) // aliasesEnabled
}));

jest.mock('utils/ResourceUtils', () => ({
  canCreate: jest.fn().mockReturnValue(true)
}));

jest.mock('services/ChangeSpaceService', () => ({
  showUpgradeSpaceDialog: jest.fn()
}));

jest.mock('../DeleteDialog', () => ({
  openDeleteEnvironmentDialog: jest.fn()
}));

describe('EnvironmentsRoute', () => {
  const defaultProps = {
    endpoint: createPaginationEndpoint([]),
    getSpaceData: () => {},
    getAliasesIds: jest.fn().mockReturnValue([]),
    goToSpaceDetail: jest.fn(),
    isMasterEnvironment: () => {},
    spaceId: 'space123',
    organizationId: 'org123',
    currentEnvironmentId: 'env123',
    canUpgradeSpace: false,
    isLegacyOrganization: false,
    pubsubClient: {
      on() {},
      off() {}
    }
  };

  afterEach(() => {
    cleanup();
    defaultProps.goToSpaceDetail.mockClear();
  });

  const generateEnvironments = (...args) => {
    return args.map(({ id, status, aliases }) => ({
      sys: {
        id,
        status: { sys: { id: status } },
        aliases
      }
    }));
  };

  const renderEnvironmentsComponent = async (...args) => {
    const envs = generateEnvironments(...args);
    const rendered = render(
      <EnvironmentsRoute {...defaultProps} endpoint={createPaginationEndpoint(envs)} />
    );
    expect(defaultProps.goToSpaceDetail).not.toHaveBeenCalled();

    await waitForElement(() => rendered.getByTestId('environment-table'));

    return rendered;
  };

  describe('redirections based on permissions', () => {
    it("redirects if user can't manage environments", () => {
      accessChecker.can.mockReturnValueOnce(false);
      render(<EnvironmentsRoute {...defaultProps} />);
    });

    it('redirects if space has environments disabled', async () => {
      LD.getCurrentVariation.mockResolvedValueOnce(false);
      render(<EnvironmentsRoute {...defaultProps} />);
      await wait();
      expect(defaultProps.goToSpaceDetail).toHaveBeenCalled();
    });
  });

  it('lists all environments with status', async () => {
    const { getByTestId } = await renderEnvironmentsComponent(
      { id: 'e1', status: 'ready' },
      { id: 'e2', status: 'queued' },
      { id: 'e3', status: 'failed' }
    );

    const env1 = getByTestId('environment.e1');
    const env2 = getByTestId('environment.e2');
    const env3 = getByTestId('environment.e3');

    expect(env1).toBeInTheDocument();
    expect(env1.textContent).toContain('e1');
    expect(env1.textContent).toContain('Ready');
    expect(env2).toBeInTheDocument();
    expect(env2.textContent).toContain('e2');
    expect(env2.textContent).toContain('In progress');
    expect(env3).toBeInTheDocument();
    expect(env3.textContent).toContain('e3');
    expect(env3.textContent).toContain('Failed');
  });

  describe('when aliases feature is disabled', () => {
    it('does not show the aliases opt-in', async () => {
      getSpaceFeature.mockReturnValueOnce(false);

      const { queryByTestId } = await renderEnvironmentsComponent(
        { id: 'e1', status: 'ready' },
        { id: 'e2', status: 'ready' }
      );

      expect(queryByTestId('environments.header')).toBeNull();
      expect(queryByTestId('environmentaliases.card')).toBeNull();
    });
  });

  describe('when aliases feature is enabled', () => {
    describe('when user has the manage aliases permission', () => {
      it('shows the aliases opt-in', async () => {
        const { queryByTestId } = await renderEnvironmentsComponent(
          { id: 'e1', status: 'ready' },
          { id: 'e2', status: 'ready' }
        );

        expect(queryByTestId('environments.header')).toBeNull();
        expect(queryByTestId('environmentaliases.card')).toBeInTheDocument();
      });

      it('shows the aliases', async () => {
        defaultProps.getAliasesIds.mockReturnValueOnce(['master']);
        const { getByTestId } = await renderEnvironmentsComponent(
          { id: 'e1', status: 'ready', aliases: ['master'] },
          { id: 'e2', status: 'ready' }
        );

        expect(getByTestId('environments.header')).toBeInTheDocument();
        expect(getByTestId('environmentaliases.card')).toBeInTheDocument();
      });

      it('cannot be deleted when environment has aliases', async () => {
        defaultProps.getAliasesIds.mockReturnValueOnce(['master']);

        const { getByTestId, queryByTestId } = await renderEnvironmentsComponent({
          id: 'e1',
          status: 'ready',
          aliases: ['master']
        });

        const env1 = getByTestId('environment.e1');
        const deleteBtn = env1.querySelector('[data-test-id="openDeleteDialog"]');
        expect(deleteBtn).toBeDisabled();
        deleteBtn.click();
        await wait();
        expect(openDeleteEnvironmentDialog).not.toHaveBeenCalled();
        expect(queryByTestId('spaceEnvironmentsDeleteDialog')).toBeNull();
      });
    });

    describe('when user does not have the manage aliases permission', () => {
      it('hides the aliases section', async () => {
        accessChecker.can.mockImplementation((_, type) => type !== 'EnvironmentAliases');

        const { queryByTestId } = await renderEnvironmentsComponent({ id: 'e1', status: 'ready' });

        expect(queryByTestId('environments.header')).toBeNull();
        expect(queryByTestId('environmentaliases.card')).toBeNull();
      });
    });
  });

  describe('shows usage info in the sidebar', () => {
    describe('on v2 pricing', () => {
      beforeEach(() => {
        defaultProps.isLegacyOrganization = false;
        createResourceService.mockImplementation(() => ({
          get: jest.fn().mockResolvedValue({ usage: 1, limits: { maximum: 1 } })
        }));
      });

      it('shows usage and limits', async () => {
        const { getByTestId } = await renderEnvironmentsComponent(
          { id: 'e1', status: 'ready' },
          { id: 'e2', status: 'ready' }
        );
        expect(getByTestId('environmentsUsage').textContent).toContain(
          'You are using 2 out of 2 environments'
        );
      });

      it('shows tooltip ', async () => {
        const { getByTestId } = await renderEnvironmentsComponent({ id: 'e1', status: 'ready' });
        const envUsage = getByTestId('environmentsUsage');
        expect(envUsage.querySelector('[data-test-id="environments-usage-tooltip"]')).toBeVisible();
      });
    });

    describe('on v1 pricing', () => {
      beforeEach(() => {
        defaultProps.isLegacyOrganization = true;
      });

      it('shows usage without limits', async () => {
        const { getByTestId } = await renderEnvironmentsComponent({ id: 'e1', status: 'ready' });
        expect(getByTestId('environmentsUsage').textContent).toContain(
          'You are using 1 environment'
        );
      });

      it('does not show tooltip ', async () => {
        const { getByTestId } = await renderEnvironmentsComponent({ id: 'e1', status: 'ready' });
        const envUsage = getByTestId('environmentsUsage');
        expect(envUsage.querySelector('[data-test-id="environments-usage-tooltip"]')).toBeNull();
      });
    });
  });

  describe('when limit is reached on v2 pricing', () => {
    beforeEach(() => {
      defaultProps.isLegacyOrganization = false;
      createResourceService.mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({ usage: 1, limits: { maximum: 1 } })
      }));
    });

    it('does not render create button', async () => {
      canCreate.mockReturnValueOnce(false);
      const { queryByTestId } = await renderEnvironmentsComponent({ id: 'e1', status: 'ready' });
      expect(queryByTestId('openCreateDialog')).toBeNull();
    });

    it('should render upgrade space button when user is admin', async () => {
      canCreate.mockReturnValueOnce(false);
      defaultProps.canUpgradeSpace = true;

      const { getByTestId, queryByTestId } = await renderEnvironmentsComponent({
        id: 'e1',
        status: 'ready'
      });

      expect(getByTestId('openUpgradeDialog')).toBeVisible();
      expect(queryByTestId('subscriptionLink')).toBeNull();
    });

    it('should not show upgrade action when user is not admin', async () => {
      defaultProps.canUpgradeSpace = false;

      const { queryByTestId } = await renderEnvironmentsComponent({ id: 'e1', status: 'ready' });

      expect(queryByTestId('openUpgradeDialog')).toBeNull();
      expect(queryByTestId('subscriptionLink')).toBeNull();
    });
  });
});
