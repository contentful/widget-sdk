import React from 'react';
import { render, waitFor } from '@testing-library/react';

import {
  OrganizationUsageRoute,
  WorkbenchContent,
  WorkbenchActions,
} from './OrganizationUsageRoute';
import ReloadNotification from 'app/common/ReloadNotification';
import * as OrganizationRolesMocked from 'services/OrganizationRoles';
import * as TokenStoreMocked from 'services/TokenStore';
import * as OrganizationMembershipRepositoryMocked from 'access_control/OrganizationMembershipRepository';
import { UsageStateContext } from '../hooks/usageContext';

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true),
}));

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllSpaces: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(() => ({})),
}));

jest.mock('app/common/ReloadNotification', () => ({
  trigger: jest.fn(),
}));

jest.mock('../components/PeriodSelector', () => ({
  PeriodSelector: jest.fn().mockReturnValue(<div data-test-id="period-selector"></div>),
}));

jest.mock('../components/OrganizationUsagePage', () => ({
  OrganizationUsagePage: jest.fn().mockReturnValue(<div data-test-id="usage-page"></div>),
}));

const DEFAULT_ORG = 'abcd';

describe('OrganizationUsageRoute', () => {
  describe('user is not owner or admin', () => {
    it('should populate error in the state', async () => {
      OrganizationRolesMocked.isOwnerOrAdmin.mockReturnValueOnce(false);

      const { getByText } = render(<OrganizationUsageRoute orgId={DEFAULT_ORG} />);

      expect(TokenStoreMocked.getOrganization).toHaveBeenCalledWith(DEFAULT_ORG);
      await waitFor(() => expect(OrganizationRolesMocked.isOwnerOrAdmin).toHaveBeenCalledWith({}));
      expect(getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('fetching org data fails with different error code', () => {
    it('should trigger reload notification', async () => {
      const error400 = new Error('Test error');
      error400.status = 400;

      OrganizationMembershipRepositoryMocked.getAllSpaces.mockRejectedValueOnce(error400);

      render(<OrganizationUsageRoute orgId={DEFAULT_ORG} />);

      await waitFor(() => expect(ReloadNotification.trigger).toHaveBeenCalled());
    });
  });
});

const MockPovider = (data) => {
  const { children } = data;
  return <UsageStateContext.Provider value={data}>{children}</UsageStateContext.Provider>;
};

MockPovider.defaultProps = {
  dispatch: () => {},
};

const defaultData = {
  isLoading: false,
  error: false,
  hasSpaces: true,
  periods: [],
  isAssetBandwidthTab: false,
  isTeamOrEnterpriseCustomer: true,
  periodicUsage: {},
  assetBandwidthData: {},
};

describe('WorkbenchActions', () => {
  describe('isLoading', () => {
    it('should render a spinner', () => {
      const { getByTestId, queryByTestId } = render(
        <MockPovider isLoading={true} isTeamOrEnterpriseCustomer={true} hasSpaces={true}>
          <WorkbenchActions />
        </MockPovider>
      );

      expect(getByTestId('organization-usage_spinner')).toBeVisible();
      expect(queryByTestId('period-selector')).toBeNull();
    });

    it('should not render spinner if there are no spaces', () => {
      const { queryByTestId } = render(
        <MockPovider isLoading={true} isTeamOrEnterpriseCustomer={true} hasSpaces={false}>
          <WorkbenchActions />
        </MockPovider>
      );

      expect(queryByTestId('organization-usage_spinner')).toBeNull();
      expect(queryByTestId('period-selector')).toBeNull();
    });
  });

  describe('org is on Team or Enterprise tier', () => {
    it('should render the PeriodSelector', () => {
      const { getByTestId } = render(
        <MockPovider {...defaultData}>
          <WorkbenchActions />
        </MockPovider>
      );

      expect(getByTestId('period-selector')).toBeInTheDocument();
    });
  });

  describe('org has no spaces', () => {
    it('should render nothing', () => {
      const data = {
        ...defaultData,
        hasSpaces: false,
      };
      const { queryByTestId } = render(
        <MockPovider {...data}>
          <WorkbenchActions />
        </MockPovider>
      );
      expect(queryByTestId('organization-usage_spinner')).toBeNull();
      expect(queryByTestId('period-selector')).toBeNull();
    });
  });

  describe('user is on the asset bandwidth tab', () => {
    it('should render a period selector', () => {
      const data = {
        ...defaultData,
        isAssetBandwidthTab: true,
      };
      const { queryByTestId } = render(
        <MockPovider {...data}>
          <WorkbenchActions />
        </MockPovider>
      );

      expect(queryByTestId('organization-usage_spinner')).toBeNull();
      expect(queryByTestId('period-selector')).toBeInTheDocument();
    });
  });
});

describe('WorkbenchContent', () => {
  describe('there are spaces', () => {
    it('should render the OrganizationUsagePage', () => {
      const { queryByTestId, getByTestId } = render(
        <MockPovider {...defaultData}>
          <WorkbenchContent />
        </MockPovider>
      );

      expect(getByTestId('usage-page')).toBeInTheDocument();

      expect(queryByTestId('usage-page__no-spaces-placeholder')).toBeNull();
    });
  });

  describe('org has no spaces', () => {
    it('should render NoSpacePlaceholder', () => {
      const data = {
        ...defaultData,
        hasSpaces: false,
      };
      const { queryByTestId, getByTestId } = render(
        <MockPovider {...data}>
          <WorkbenchContent />
        </MockPovider>
      );

      expect(getByTestId('usage-page__no-spaces-placeholder')).toBeInTheDocument();

      expect(queryByTestId('usage-page')).toBeNull();
    });
  });
});
