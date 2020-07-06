import React from 'react';
import { shallow } from 'enzyme';
import 'jest-enzyme';
import { Spinner, Select } from '@contentful/forma-36-react-components';
import {
  OrganizationUsageRouteNew,
  WorkbenchContent,
  WorkbenchActions,
} from './OrganizationUsageRouteNew';
import { PeriodSelector } from '../components/PeriodSelector';
import { NoSpacesPlaceholder } from '../components/NoSpacesPlaceholder';
import { OrganizationUsagePage } from '../components/OrganizationUsagePage';
import ReloadNotification from 'app/common/ReloadNotification';
import * as OrganizationRolesMocked from 'services/OrganizationRoles';
import * as TokenStoreMocked from 'services/TokenStore';
import * as OrganizationMembershipRepositoryMocked from 'access_control/OrganizationMembershipRepository';
import {
  isEnterprisePlan,
  getPlansWithSpaces,
  isSelfServicePlan,
} from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import { getPeriods, getOrgUsage, getApiUsage } from '../services/UsageService';
import LoadingState from 'app/common/LoadingState';

jest.mock('services/intercom', () => ({}));
jest.mock('utils/ResourceUtils', () => ({}));
jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true),
}));

jest.mock('services/ResourceService', () => {
  const service = {
    get: jest.fn((resource) => {
      switch (resource) {
        case 'api_request':
          return { limits: { included: 1000000 } };
        case 'asset_bandwidth':
          return {
            usage: 200,
            unitOfMeasure: 'MB',
            limits: { included: 2000 },
          };
      }
    }),
    getAll: jest.fn(),
  };

  return () => service;
});

jest.mock('account/pricing/PricingDataProvider', () => {
  const getPlansWithSpaces = jest.fn(() => ({
    items: [
      { name: 'Test plan', space: { sys: { id: 'space1' } } },
      { name: 'Proof of concept (space trial)', space: { sys: { id: 'space2' } } },
    ],
  }));
  return {
    isEnterprisePlan: jest.fn(),
    isSelfServicePlan: jest.fn(),
    getBasePlan: jest.fn(),
    getPlansWithSpaces,
  };
});

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllSpaces: jest.fn(() => [
    { name: 'Test1', sys: { id: 'test1' } },
    { name: 'Test2', sys: { id: 'test2' } },
  ]),
}));

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(() => ({})),
}));

jest.mock('data/EndpointFactory', () => {
  const moment = require('moment');
  const _ = require('lodash');
  const DATE_FORMAT = 'YYYY-MM-DD';
  const startDate = moment('2019-01-04').subtract(12, 'days');
  const endpoint = jest.fn().mockImplementation(({ method, path }) => {
    if (method === 'GET' && _.isEqual(path, ['usage_periods'])) {
      return {
        items: [
          {
            startDate: startDate.format(DATE_FORMAT),
            endDate: null,
            sys: { type: 'UsagePeriod', id: '0' },
          },
          {
            startDate: moment(startDate)
              .subtract(1, 'day')
              .subtract(1, 'month')
              .format(DATE_FORMAT),
            endDate: moment(startDate).subtract(1, 'day').format(DATE_FORMAT),
            sys: { type: 'UsagePeriod', id: '1' },
          },
        ],
      };
    }
  });

  return {
    createOrganizationEndpoint: () => endpoint,
  };
});

jest.mock('app/common/ReloadNotification', () => ({
  trigger: jest.fn(),
}));

jest.mock('../services/UsageService', () => ({
  getPeriods: jest.fn().mockReturnValue({ items: [{}] }),
  getApiUsage: jest.fn(),
  getOrgUsage: jest.fn(),
}));

const shallowRenderComponent = async (props) => {
  const wrapper = shallow(<OrganizationUsageRouteNew {...props} />);
  // Need to wait for internal async logic to finish
  // This means `componentDidMount` is called twice,
  //  which could potentially cause problems if it's not
  //  idempotent.
  await wrapper.instance().componentDidMount();
  return wrapper;
};

describe('OrganizationUsageRouteNew', () => {
  let defaultProps;

  beforeAll(() => {
    defaultProps = {
      orgId: '23423',
    };
    // set fixed date for stable snapshots
    // moment('2017-12-01').unix() = 1512082800
    jest.spyOn(Date, 'now').mockImplementation(() => 1512082800);
  });

  afterAll(() => {
    Date.now.mockRestore();
  });

  it('should render page without errors', async () => {
    const wrapper = await shallowRenderComponent(defaultProps);

    expect(wrapper).toMatchSnapshot();
  });

  describe('user is not owner or admin', () => {
    it('should populate error in the state', async () => {
      OrganizationRolesMocked.isOwnerOrAdmin.mockReturnValueOnce(false);

      const wrapper = await shallowRenderComponent(defaultProps);

      expect(TokenStoreMocked.getOrganization).toHaveBeenCalledWith(defaultProps.orgId);
      expect(OrganizationRolesMocked.isOwnerOrAdmin).toHaveBeenCalledWith({});
      expect(wrapper.state('error')).toBeTruthy();
    });
  });

  describe('fetching org data fails with 404', () => {
    it('should populate error in the state', async () => {
      const error404 = new Error('Test error');
      error404.status = 404;

      OrganizationMembershipRepositoryMocked.getAllSpaces.mockRejectedValueOnce(error404);

      const wrapper = await shallowRenderComponent(defaultProps);

      expect(wrapper.state('error')).toBeTruthy();
    });
  });

  describe('fetching org data fails with 403', () => {
    it('should populate error in the state', async () => {
      const error403 = new Error('Test error');
      error403.status = 403;
      OrganizationMembershipRepositoryMocked.getAllSpaces.mockRejectedValueOnce(error403);

      const wrapper = await shallowRenderComponent(defaultProps);

      expect(wrapper.state('error')).toBeTruthy();
    });
  });

  describe('fetching org data fails with different error code', () => {
    it('should trigger reload notification', async () => {
      const error400 = new Error('Test error');
      error400.status = 400;

      OrganizationMembershipRepositoryMocked.getAllSpaces.mockRejectedValueOnce(error400);

      await shallowRenderComponent(defaultProps);

      expect(ReloadNotification.trigger).toHaveBeenCalled();
    });
  });

  describe('org is on the community tier', () => {
    beforeEach(() => {
      isEnterprisePlan.mockReset().mockReturnValue(false);
      isSelfServicePlan.mockReset().mockReturnValue(false);
    });

    it('should fetch data', async () => {
      await shallowRenderComponent(defaultProps);

      expect(getPlansWithSpaces).toHaveBeenCalled();
      expect(OrganizationMembershipRepositoryMocked.getAllSpaces).toHaveBeenCalled();
      expect(getPeriods).toHaveBeenCalled();
      expect(createResourceService().get).toHaveBeenCalledWith('api_request');

      expect(getOrgUsage).toHaveBeenCalled();
      expect(getApiUsage).toHaveBeenCalled();
    });
  });

  describe('org is on the team or enterprise tier', () => {
    describe('enterprise tier', () => {
      beforeEach(() => {
        isEnterprisePlan.mockReset().mockReturnValue(true);
        isSelfServicePlan.mockReset().mockReturnValue(false);
      });

      it('should fetch data', async () => {
        await shallowRenderComponent(defaultProps);

        expect(getPlansWithSpaces).toHaveBeenCalled();
        expect(OrganizationMembershipRepositoryMocked.getAllSpaces).toHaveBeenCalled();
        expect(createResourceService().get).toHaveBeenCalledWith('api_request');
        expect(getPeriods).toHaveBeenCalled();

        expect(getOrgUsage).toHaveBeenCalled();
        expect(getApiUsage).toHaveBeenCalled();
      });
    });

    describe('team tier', () => {
      beforeEach(() => {
        isEnterprisePlan.mockReset().mockReturnValue(false);
        isSelfServicePlan.mockReset().mockReturnValue(true);
      });

      it('should fetch data', async () => {
        await shallowRenderComponent(defaultProps);

        expect(getPlansWithSpaces).toHaveBeenCalled();
        expect(OrganizationMembershipRepositoryMocked.getAllSpaces).toHaveBeenCalled();
        expect(createResourceService().get).toHaveBeenCalledWith('api_request');
        expect(getPeriods).toHaveBeenCalled();

        expect(getApiUsage).toHaveBeenCalled();
        expect(getOrgUsage).toHaveBeenCalled();
      });
    });
  });
});

describe('WorkbenchActions', () => {
  let defaultProps;

  beforeEach(() => {
    defaultProps = {
      hasSpaces: true,
      periods: [],
      selectedPeriodIndex: 0,
      setPeriodIndex: jest.fn(),
      isAssetBandwidthTab: false,
      isTeamOrEnterpriseCustomer: true,
    };
  });

  describe('isLoading', () => {
    it('should render a spinner', () => {
      const wrapper = shallow(<WorkbenchActions isLoading={true} {...defaultProps} />);

      expect(wrapper.find(Spinner)).toHaveLength(1);

      expect(wrapper.find(PeriodSelector)).toHaveLength(0);
    });

    it('should not render spinner if there are no spaces', () => {
      const wrapper = shallow(<WorkbenchActions isLoading hasSpaces={false} />);

      expect(wrapper.find(Spinner)).toHaveLength(0);

      expect(wrapper.find(PeriodSelector)).toHaveLength(0);
    });
  });

  describe('org is on the enterprise or team tier', () => {
    it('should render the PeriodSelector', () => {
      const wrapper = shallow(<WorkbenchActions {...defaultProps} />);

      expect(wrapper.find(PeriodSelector)).toHaveLength(1);
    });

    it('should render nothing if there are no spaces', () => {
      defaultProps.hasSpaces = false;
      const wrapper = shallow(<WorkbenchActions {...defaultProps} />);

      expect(wrapper.find(PeriodSelector)).toHaveLength(0);
      expect(wrapper.find(Spinner)).toHaveLength(0);
    });
  });

  describe('org is on the community tier', () => {
    it('should render the PeriodSelector without Select', () => {
      defaultProps.isTeamOrEnterpriseCustomer = false;
      const wrapper = shallow(<WorkbenchActions {...defaultProps} />);

      expect(wrapper.find(PeriodSelector)).toHaveLength(1);
      expect(wrapper.find(Select)).toHaveLength(0);
    });

    it('should render nothing if there are no spaces', () => {
      defaultProps.isTeamOrEnterpriseCustomer = false;
      defaultProps.hasSpaces = false;
      const wrapper = shallow(<WorkbenchActions {...defaultProps} />);

      expect(wrapper.find(PeriodSelector)).toHaveLength(0);
      expect(wrapper.find(Spinner)).toHaveLength(0);
    });
  });
});

describe('WorkbenchContent', () => {
  let defaultProps = null;

  beforeEach(() => {
    defaultProps = {
      hasSpaces: true,
      selectedPeriodIndex: 0,
      spaceNames: { space1: 'Space1', space2: 'Space2' },
      isPoC: { space1: false, space2: true },
      periodicUsage: {
        org: { usage: [] },
        apis: { cma: { items: [] } },
      },
      apiRequestIncludedLimit: 1000,
      assetBandwidthUsage: 100,
      assetBandwidthIncludedLimit: 50,
      assetBandwidthUOM: 'GB',
      isLoading: false,
      periods: [],
    };
  });

  describe('isLoading', () => {
    it('should render a LoadingState', () => {
      defaultProps.isLoading = true;
      const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

      expect(wrapper.find(LoadingState)).toHaveLength(1);
    });
  });

  it('should render the OrganizationUsagePage if there are spaces', () => {
    const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

    expect(wrapper.find(OrganizationUsagePage)).toHaveLength(1);

    expect(wrapper.find(NoSpacesPlaceholder)).toHaveLength(0);
  });

  it('should render NoSpacePlaceholder if there are no spaces', () => {
    defaultProps.hasSpaces = false;
    const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

    expect(wrapper.find(NoSpacesPlaceholder)).toHaveLength(1);

    expect(wrapper.find(OrganizationUsagePage)).toHaveLength(0);
  });
});
