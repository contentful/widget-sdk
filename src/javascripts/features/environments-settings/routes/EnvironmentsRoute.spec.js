import React from 'react';
import { render, waitForElement, wait, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EnvironmentsRoute } from './EnvironmentsRoute';
import * as accessChecker from 'access_control/AccessChecker';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';
import { openDeleteEnvironmentDialog } from '../components/DeleteDialog';
import { beginSpaceChange } from 'services/ChangeSpaceService';
import { canCreate } from 'utils/ResourceUtils';
import { createPaginationEndpoint } from '__mocks__/data/EndpointFactory';
import * as Fake from 'test/helpers/fakeFactory';
import * as trackCTA from 'analytics/trackCTA';
import * as PricingService from 'services/PricingService';
import { go } from 'states/Navigator';
import { getEnvironmentAliasesIds } from 'core/services/SpaceEnvContext/utils';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { useSpaceEnvEndpoint } from 'core/hooks/useSpaceEnvEndpoint';

jest.mock('access_control/AccessChecker', () => ({
  can: jest.fn().mockReturnValue(true),
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  getOrgFeature: jest.fn().mockResolvedValue(true), // canSelectSource
  getSpaceFeature: jest.fn().mockResolvedValue(true), // aliasesEnabled, customAliasesEnabled
}));

jest.mock('utils/ResourceUtils', () => ({
  canCreate: jest.fn().mockReturnValue(true),
}));

jest.mock('services/ChangeSpaceService', () => ({
  beginSpaceChange: jest.fn(),
  showUpgradeSpaceDialog: jest.fn(),
}));

const trackTargetedCTAClick = jest.spyOn(trackCTA, 'trackTargetedCTAClick');

jest.mock('../components/DeleteDialog', () => ({
  openDeleteEnvironmentDialog: jest.fn(),
}));

const mockSpacePlan = Fake.Space();

jest.mock('states/Navigator');
jest.mock('core/services/SpaceEnvContext/utils');
jest.mock('services/OrganizationRoles');

const defaultSpaceId = 'space123';
const defaultOrganizationId = 'org123';
jest.mock('core/services/SpaceEnvContext/useSpaceEnvContext', () => ({
  useSpaceEnvContext: jest.fn().mockReturnValue({
    currentSpaceId: defaultSpaceId,
    currentEnvironmentAliasId: 'master',
    currentEnvironment: {
      sys: {
        id: 'master',
      },
    },
    currentOrganizationId: defaultOrganizationId,
    currentOrganization: {},
    currentSpaceData: {},
    spaceResources: {
      get: jest.fn().mockResolvedValue({ usage: 1, limits: { maximum: 1 } }),
    },
  }),
}));
jest.mock('core/hooks/useSpaceEnvEndpoint');

describe('EnvironmentsRoute', () => {
  beforeEach(() => {
    getEnvironmentAliasesIds.mockReturnValue(['master']);

    useSpaceEnvEndpoint.mockReturnValue(createPaginationEndpoint([]));

    jest.spyOn(PricingService, 'nextSpacePlanForResource').mockImplementation(async () => null);

    go.mockClear();
  });

  afterEach(() => {
    PricingService.nextSpacePlanForResource.mockRestore();
  });

  const generateEnvironments = (...args) => {
    return args.map(({ id, status, aliases, aliasedEnvironment, spaceId }) => ({
      sys: {
        id,
        space: { sys: { id: spaceId } },
        status: { sys: { id: status } },
        aliases,
        aliasedEnvironment,
      },
    }));
  };

  const renderEnvironmentsComponent = async (...args) => {
    const envs = generateEnvironments(...args);
    useSpaceEnvEndpoint.mockReturnValue(createPaginationEndpoint(envs));

    const rendered = render(<EnvironmentsRoute />);
    expect(go).not.toHaveBeenCalled();

    await waitForElement(() => rendered.getByTestId('environment-table'));

    return rendered;
  };

  describe('redirections based on permissions', () => {
    it("redirects if user can't manage environments", async () => {
      accessChecker.can.mockReturnValueOnce(false);
      render(<EnvironmentsRoute />);
      await wait();
    });
  });

  it('lists all environments with status', async () => {
    const { getByTestId } = await renderEnvironmentsComponent(
      { id: 'e1', status: 'ready', spaceId: defaultSpaceId },
      { id: 'e2', status: 'queued', spaceId: defaultSpaceId },
      { id: 'e3', status: 'failed', spaceId: defaultSpaceId }
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
        { id: 'e1', status: 'ready', spaceId: defaultSpaceId },
        { id: 'e2', status: 'ready', spaceId: defaultSpaceId }
      );

      expect(queryByTestId('environments.header')).toBeNull();
      expect(queryByTestId('environmentaliases.card')).toBeNull();
    });
  });

  describe('when aliases feature is enabled', () => {
    describe('when user has the manage aliases permission', () => {
      it('shows the aliases opt-in', async () => {
        const { queryByTestId } = await renderEnvironmentsComponent(
          { id: 'e1', status: 'ready', spaceId: defaultSpaceId },
          { id: 'e2', status: 'ready', spaceId: defaultSpaceId }
        );

        expect(queryByTestId('environments.header')).toBeNull();
        expect(queryByTestId('environmentalias.wrapper.optin')).toBeInTheDocument();
      });

      it('shows the aliases', async () => {
        const { getByTestId } = await renderEnvironmentsComponent(
          { id: 'e1', status: 'ready', aliases: ['master'], spaceId: defaultSpaceId },
          { id: 'e2', status: 'ready', aliases: [], spaceId: defaultSpaceId },
          {
            id: 'master',
            status: 'ready',
            spaceId: defaultSpaceId,
            aliasedEnvironment: {
              sys: {
                id: 'e1',
                status: 'ready',
                spaceId: defaultSpaceId,
              },
            },
          }
        );

        expect(getByTestId('environments.header')).toBeInTheDocument();
        expect(getByTestId('environmentalias.wrapper.master')).toBeInTheDocument();
      });

      it('cannot be deleted when environment has aliases', async () => {
        const { getByTestId, queryByTestId } = await renderEnvironmentsComponent({
          id: 'e1',
          status: 'ready',
          aliases: ['master'],
          spaceId: defaultSpaceId,
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

        const { queryByTestId } = await renderEnvironmentsComponent({
          id: 'e1',
          status: 'ready',
          spaceId: defaultSpaceId,
        });

        expect(queryByTestId('environments.header')).toBeNull();
        expect(queryByTestId('environmentaliases.card')).toBeNull();
      });
    });
  });

  describe('shows usage info in the sidebar', () => {
    describe('on v2 pricing', () => {
      it('shows usage and limits', async () => {
        const { getByTestId } = await renderEnvironmentsComponent(
          { id: 'e1', status: 'ready', aliases: ['master'], spaceId: defaultSpaceId },
          { id: 'e2', status: 'ready', aliases: [], spaceId: defaultSpaceId },
          {
            id: 'master',
            status: 'ready',
            spaceId: defaultSpaceId,
            aliasedEnvironment: {
              sys: {
                id: 'e1',
                status: 'ready',
                spaceId: defaultSpaceId,
              },
            },
          }
        );
        expect(getByTestId('environmentsUsage').textContent).toContain(
          'You are using 2 out of 2 environments'
        );

        expect(getByTestId('environmentsAliasUsage').textContent).toContain(
          'You are using 1 out of 3 environment aliases'
        );
      });

      it('shows tooltip ', async () => {
        const { getByTestId } = await renderEnvironmentsComponent({
          id: 'e1',
          status: 'ready',
          spaceId: defaultSpaceId,
        });
        const envUsage = getByTestId('environmentsUsage');
        expect(envUsage.querySelector('[data-test-id="environments-usage-tooltip"]')).toBeVisible();
      });
    });
  });

  describe('when limit is reached on v2 pricing', () => {
    beforeEach(() => {
      canCreate.mockReturnValueOnce(false);
    });

    it('does not render create button', async () => {
      const { queryByTestId } = await renderEnvironmentsComponent({
        id: 'e1',
        status: 'ready',
        spaceId: defaultSpaceId,
      });
      expect(queryByTestId('openCreateDialog')).toBeNull();
    });

    it('should render upgrade space button when user is admin and there is an available next space plan', async () => {
      PricingService.nextSpacePlanForResource.mockResolvedValueOnce(mockSpacePlan);
      isOwnerOrAdmin.mockReturnValueOnce(true);

      await renderEnvironmentsComponent({
        id: 'e1',
        status: 'ready',
        spaceId: defaultSpaceId,
      });

      expect(screen.getByTestId('upgradeMessage').textContent).toEqual(
        'Upgrade the space to add more.'
      );

      expect(screen.getByTestId('openUpgradeDialog')).toBeVisible();
      expect(screen.getByTestId('openUpgradeDialog').textContent).toEqual('Upgrade space');

      userEvent.click(screen.getByTestId('openUpgradeDialog'));
      expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_SPACE_PLAN, {
        organizationId: defaultOrganizationId,
        spaceId: defaultSpaceId,
      });
      expect(beginSpaceChange).toBeCalled();

      expect(screen.queryByTestId('subscriptionLink')).toBeNull();
    });

    it('should render talk to us button when user is admin/owner and there is no available next space plan', async () => {
      PricingService.nextSpacePlanForResource.mockResolvedValueOnce(null);

      isOwnerOrAdmin.mockReturnValueOnce(true);

      await renderEnvironmentsComponent({
        id: 'e1',
        status: 'ready',
        spaceId: defaultSpaceId,
      });

      expect(screen.getByTestId('upgradeMessage').textContent).toEqual(
        'Talk to us about upgrading to an enterprise space plan.'
      );

      expect(screen.getByTestId('upgradeToEnterpriseButton')).toBeVisible();
      expect(screen.getByTestId('upgradeToEnterpriseButton').textContent).toEqual('Talk to us');
      userEvent.click(screen.getByTestId('upgradeToEnterpriseButton'));

      expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
        organizationId: defaultOrganizationId,
        spaceId: defaultSpaceId,
      });

      expect(screen.queryByTestId('subscriptionLink')).toBeNull();
    });

    it('should not show upgrade action when user is not admin', async () => {
      isOwnerOrAdmin.mockReturnValueOnce(false);

      const { getByTestId, queryByTestId } = await renderEnvironmentsComponent({
        id: 'e1',
        status: 'ready',
        spaceId: defaultSpaceId,
      });

      expect(queryByTestId('openUpgradeDialog')).toBeNull();
      expect(queryByTestId('upgradeToEnterpriseButton')).toBeNull();
      expect(getByTestId('upgradeMessage')).toBeVisible();
      expect(getByTestId('upgradeMessage').textContent).toEqual(
        'Ask the administrator of your organization to upgrade the space plan.'
      );
      expect(queryByTestId('subscriptionLink')).toBeNull();
    });
  });
});
