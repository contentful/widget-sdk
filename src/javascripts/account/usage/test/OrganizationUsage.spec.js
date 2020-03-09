import React from 'react';
import { shallow } from 'enzyme';
import 'jest-enzyme';
import { Spinner } from '@contentful/forma-36-react-components';

import { OrganizationUsage, WorkbenchContent, WorkbenchActions } from '../OrganizationUsage';
import PeriodSelector from '../committed/PeriodSelector';
import NoSpacesPlaceholder from '../NoSpacesPlaceholder';
import OrganizationUsagePage from '../committed/OrganizationUsagePage';
import OrganizationResourceUsageList from 'account/usage/non_committed/OrganizationResourceUsageList';
import ReloadNotification from 'app/common/ReloadNotification';
import * as OrganizationRolesMocked from 'services/OrganizationRoles';
import * as TokenStoreMocked from 'services/TokenStore';
import * as OrganizationMembershipRepositoryMocked from 'access_control/OrganizationMembershipRepository';

jest.mock('services/intercom', () => ({}));
jest.mock('utils/ResourceUtils', () => ({}));
jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true)
}));
jest.mock('services/ResourceService', () => () => ({
  get: jest.fn(resource => {
    switch (resource) {
      case 'api_request':
        return { limits: { included: 1000000 } };
      case 'asset_bandwidth':
        return {
          usage: 200,
          unitOfMeasure: 'MB',
          limits: { included: 2000 }
        };
    }
  }),
  getAll: jest.fn()
}));

jest.mock('account/pricing/PricingDataProvider', () => {
  const isEnterprisePlan = jest.fn(() => true);

  const getPlansWithSpaces = jest.fn(() => ({
    items: [
      { name: 'Test plan', space: { sys: { id: 'space1' } } },
      { name: 'Proof of concept (space trial)', space: { sys: { id: 'space2' } } }
    ]
  }));
  return {
    isEnterprisePlan,
    getBasePlan: jest.fn(),
    getPlansWithSpaces
  };
});

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllSpaces: jest.fn(() => [
    { name: 'Test1', sys: { id: 'test1' } },
    { name: 'Test2', sys: { id: 'test2' } }
  ])
}));

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(() => ({}))
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
            sys: { type: 'UsagePeriod', id: '0' }
          },
          {
            startDate: moment(startDate)
              .subtract(1, 'day')
              .subtract(1, 'month')
              .format(DATE_FORMAT),
            endDate: moment(startDate)
              .subtract(1, 'day')
              .format(DATE_FORMAT),
            sys: { type: 'UsagePeriod', id: '1' }
          }
        ]
      };
    }
  });

  return {
    createOrganizationEndpoint: () => endpoint
  };
});

jest.mock('app/common/ReloadNotification', () => ({
  trigger: jest.fn()
}));

const shallowRenderComponent = async props => {
  const wrapper = shallow(<OrganizationUsage {...props} />);
  // Need to wait for internal async logic to finish
  // This means `componentDidMount` is called twice,
  //  which could potentially cause problems if it's not
  //  idempotent.
  await wrapper.instance().componentDidMount();
  return wrapper;
};

describe('OrganizationUsage', () => {
  let defaultProps;

  beforeAll(() => {
    defaultProps = {
      orgId: '23423'
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
});

describe('WorkbenchActions', () => {
  it('should render', () => {
    const wrapper = shallow(<WorkbenchActions />);

    expect(wrapper).toMatchSnapshot();
  });

  describe('isLoading', () => {
    it('should render a spinner', () => {
      const wrapper = shallow(<WorkbenchActions isLoading />);

      expect(wrapper.find(Spinner)).toHaveLength(1);

      expect(wrapper.find(PeriodSelector)).toHaveLength(0);
    });
  });

  describe('org is committed and periods received', () => {
    it('should render the PeriodSelector', () => {
      const wrapper = shallow(
        <WorkbenchActions
          hasSpaces
          committed
          periods={[]}
          selectedPeriodIndex={0}
          setPeriodIndex={() => {}}
        />
      );

      expect(wrapper.find(PeriodSelector)).toHaveLength(1);
    });
  });

  describe('org is not committed', () => {
    it('should render nothing', () => {
      const wrapper = shallow(
        <WorkbenchActions
          hasSpaces
          periods={[]}
          selectedPeriodIndex={0}
          setPeriodIndex={() => {}}
        />
      );

      expect(wrapper.find(PeriodSelector)).toHaveLength(0);
      expect(wrapper.find(Spinner)).toHaveLength(0);
    });
  });

  describe('org has no spaces', () => {
    it('should render nothing', () => {
      const wrapper = shallow(
        <WorkbenchActions
          committed
          periods={[]}
          selectedPeriodIndex={0}
          setPeriodIndex={() => {}}
        />
      );

      expect(wrapper.find(PeriodSelector)).toHaveLength(0);
      expect(wrapper.find(Spinner)).toHaveLength(0);
    });
  });
});

describe('WorkbenchContent', () => {
  let defaultProps = null;

  beforeEach(() => {
    defaultProps = {
      committed: true,
      hasSpaces: true,
      selectedPeriodIndex: 0,
      spaceNames: { space1: 'Space1', space2: 'Space2' },
      isPoC: { space1: false, space2: true },
      periodicUsage: {},
      apiRequestIncludedLimit: 1000,
      assetBandwidthUsage: 100,
      assetBandwidthIncludedLimit: 50,
      assetBandwidthUOM: 'GB',
      isLoading: false,
      periods: [],
      resources: [],
      newUsagePageVariation: false
    };
  });

  it('should render', () => {
    const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

    expect(wrapper).toMatchSnapshot();
  });

  describe('org is committed and there are spaces', () => {
    it('should render the OrganizationUsagePage', () => {
      const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

      expect(wrapper.find(OrganizationUsagePage)).toHaveLength(1);

      expect(wrapper.find(NoSpacesPlaceholder)).toHaveLength(0);
      expect(wrapper.find(OrganizationResourceUsageList)).toHaveLength(0);
    });
  });

  describe('org has no spaces', () => {
    it('should render NoSpacePlaceholder', () => {
      const wrapper = shallow(
        <WorkbenchContent {...{ ...defaultProps, ...{ hasSpaces: false } }} />
      );

      expect(wrapper.find(NoSpacesPlaceholder)).toHaveLength(1);

      expect(wrapper.find(OrganizationUsagePage)).toHaveLength(0);
      expect(wrapper.find(OrganizationResourceUsageList)).toHaveLength(0);
    });
  });

  describe('org is not committed', () => {
    beforeEach(() => {
      defaultProps.committed = false;
    });

    it('should render OrganizationResourceUsageList', () => {
      const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

      expect(wrapper.find(OrganizationResourceUsageList)).toHaveLength(1);

      expect(wrapper.find(OrganizationUsagePage)).toHaveLength(0);
      expect(wrapper.find(NoSpacesPlaceholder)).toHaveLength(0);
    });

    describe('no resources given', () => {
      beforeEach(() => {
        defaultProps.resources = undefined;
      });

      it('should render nothing', () => {
        const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

        expect(wrapper.find(OrganizationResourceUsageList)).toHaveLength(0);
        expect(wrapper.find(OrganizationUsagePage)).toHaveLength(0);
        expect(wrapper.find(NoSpacesPlaceholder)).toHaveLength(0);
      });
    });
  });
});
