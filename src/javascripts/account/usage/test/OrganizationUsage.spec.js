import React from 'react';
import { shallow } from 'enzyme';
import moment from 'moment';
import { isEqual } from 'lodash';

import { Spinner } from '@contentful/ui-component-library';

import { OrganizationUsage, WorkbenchContent, WorkbenchActions } from '../OrganizationUsage.es6';
import PeriodSelector from '../committed/PeriodSelector.es6';
import NoSpacesPlaceholder from '../NoSpacesPlaceholder.es6';
import OrganizationUsagePage from '../committed/OrganizationUsagePage.es6';
import OrganizationResourceUsageList from 'account/usage/non_committed/OrganizationResourceUsageList.es6';

const DATE_FORMAT = 'YYYY-MM-DD';

let defaultProps = null;
let testOrg = null;
let endpoint = null;
let resourceService = null;
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
  beforeAll(() => {
    // set fixed date for stable snapshots
    // moment('2017-12-01').unix() = 1512082800
    jest.spyOn(Date, 'now').mockImplementation(() => 1512082800);
  });

  afterAll(() => {
    Date.now.mockRestore();
  });

  beforeEach(() => {
    testOrg = {};
    const startDate = moment().subtract(12, 'days');

    endpoint = jest.fn(({ method, path }) => {
      if (method === 'GET' && isEqual(path, ['usage_periods'])) {
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

    const isEnterprisePlan = jest.fn(() => true);
    const isOwnerOrAdmin = jest.fn(() => true);
    const getPlansWithSpaces = jest.fn(() => ({
      items: [
        { name: 'Test plan', space: { sys: { id: 'space1' } } },
        { name: 'Proof of concept', space: { sys: { id: 'space2' } } }
      ]
    }));

    resourceService = {
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
    };
    const ResourceService = { default: () => resourceService };

    const getAllSpaces = jest.fn(() => [
      { name: 'Test1', sys: { id: 'test1' } },
      { name: 'Test2', sys: { id: 'test2' } }
    ]);

    const getCurrentVariation = jest.fn(fs => fs === 'feature-bizvel-09-2018-usage');

    const getOrganization = jest.fn(() => testOrg);

    defaultProps = {
      orgId: '23423',
      onReady: jest.fn(),
      onForbidden: jest.fn(),
      $services: {
        OrganizationRoles: { isOwnerOrAdmin },
        PricingDataProvider: {
          isEnterprisePlan,
          getBasePlan: jest.fn(),
          getPlansWithSpaces
        },
        ResourceService,
        ReloadNotification: { trigger: jest.fn() },
        OrganizationMembershipRepository: { getAllSpaces },
        EndpointFactory: { createOrganizationEndpoint: () => endpoint },
        Analytics: { track: jest.fn() },
        LaunchDarkly: { getCurrentVariation },
        TokenStore: { getOrganization }
      }
    };
  });

  it('should render page without errors', async () => {
    const wrapper = await shallowRenderComponent(defaultProps);

    expect(wrapper).toMatchSnapshot();
  });

  it('should call `onReady`', async () => {
    await shallowRenderComponent(defaultProps);
    expect(defaultProps.onReady).toHaveBeenCalled();
  });

  it('should request data', async () => {
    await shallowRenderComponent(defaultProps);

    expect(endpoint).toHaveBeenCalledWith(
      {
        method: 'GET',
        path: ['usage_periods']
      },
      { 'x-contentful-enable-alpha-feature': 'usage-insights' }
    );
    expect(endpoint).toHaveBeenCalledWith(
      {
        method: 'GET',
        path: ['usages', 'organization'],
        query: {
          'filters[metric]': 'allApis',
          'filters[usagePeriod]': '0'
        }
      },
      { 'x-contentful-enable-alpha-feature': 'usage-insights' }
    );
    expect(endpoint).toHaveBeenCalledWith(
      {
        method: 'GET',
        path: ['usages', 'space'],
        query: {
          'filters[metric]': 'cpa',
          'filters[usagePeriod]': '0',
          'orderBy[metricUsage]': 'desc',
          limit: 3
        }
      },
      { 'x-contentful-enable-alpha-feature': 'usage-insights' }
    );
    expect(endpoint).toHaveBeenCalledWith(
      {
        method: 'GET',
        path: ['usages', 'space'],
        query: {
          'filters[metric]': 'cda',
          'filters[usagePeriod]': '0',
          'orderBy[metricUsage]': 'desc',
          limit: 3
        }
      },
      { 'x-contentful-enable-alpha-feature': 'usage-insights' }
    );
    expect(endpoint).toHaveBeenCalledWith(
      {
        method: 'GET',
        path: ['usages', 'space'],
        query: {
          'filters[metric]': 'cma',
          'filters[usagePeriod]': '0',
          'orderBy[metricUsage]': 'desc',
          limit: 3
        }
      },
      { 'x-contentful-enable-alpha-feature': 'usage-insights' }
    );
  });

  describe('user is not owner or admin', () => {
    beforeEach(() => {
      defaultProps.$services.OrganizationRoles.isOwnerOrAdmin.mockReturnValue(false);
    });

    it('should call `onForbidden`', async () => {
      await shallowRenderComponent(defaultProps);

      expect(defaultProps.$services.TokenStore.getOrganization).toHaveBeenCalledWith(
        defaultProps.orgId
      );
      expect(defaultProps.$services.OrganizationRoles.isOwnerOrAdmin).toHaveBeenCalledWith(testOrg);
      const errArg = defaultProps.onForbidden.mock.calls[0][0];
      expect(errArg).toBeInstanceOf(Error);
      expect(errArg.message).toBe('No permission');
    });
  });

  describe('fetching org data fails with 404', () => {
    const error404 = new Error('Test error');
    error404.status = 404;

    beforeEach(() => {
      defaultProps.$services.OrganizationMembershipRepository.getAllSpaces.mockReturnValue(
        Promise.reject(error404)
      );
    });

    it('should call `onForbidden`', async () => {
      await shallowRenderComponent(defaultProps);

      expect(defaultProps.onForbidden).toHaveBeenCalledWith(error404);
    });
  });

  describe('fetching org data fails with 403', () => {
    const error403 = new Error('Test error');
    error403.status = 403;

    beforeEach(() => {
      defaultProps.$services.OrganizationMembershipRepository.getAllSpaces.mockReturnValue(
        Promise.reject(error403)
      );
    });

    it('should call `onForbidden`', async () => {
      await shallowRenderComponent(defaultProps);

      expect(defaultProps.onForbidden).toHaveBeenCalledWith(error403);
    });
  });

  describe('fetching org data fails with different error code', () => {
    const error400 = new Error('Test error');
    error400.status = 400;

    beforeEach(() => {
      defaultProps.$services.OrganizationMembershipRepository.getAllSpaces.mockReturnValue(
        Promise.reject(error400)
      );
    });

    it('should trigger reload notification', async () => {
      await shallowRenderComponent(defaultProps);

      expect(defaultProps.onForbidden).not.toHaveBeenCalled();
      expect(defaultProps.$services.ReloadNotification.trigger).toHaveBeenCalled();
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

  describe('org is committed, flag is set and periods received', () => {
    it('should render the PeriodSelector', () => {
      const wrapper = shallow(
        <WorkbenchActions
          hasSpaces
          committed
          flagActive
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
          flagActive
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
          flagActive
          periods={[]}
          selectedPeriodIndex={0}
          setPeriodIndex={() => {}}
        />
      );

      expect(wrapper.find(PeriodSelector)).toHaveLength(0);
      expect(wrapper.find(Spinner)).toHaveLength(0);
    });
  });

  describe('feature flag not set', () => {
    it('should render nothing', () => {
      const wrapper = shallow(
        <WorkbenchActions
          hasSpaces
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
      flagActive: true,
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
      resources: []
    };
  });

  it('should render', () => {
    const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

    expect(wrapper).toMatchSnapshot();
  });

  describe('org is committed, flag is active and there are spaces', () => {
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

  describe('feature flag is not active', () => {
    it('should render OrganizationResourceUsageList', () => {
      const wrapper = shallow(
        <WorkbenchContent {...{ ...defaultProps, ...{ flagActive: false } }} />
      );

      expect(wrapper.find(OrganizationResourceUsageList)).toHaveLength(1);

      expect(wrapper.find(OrganizationUsagePage)).toHaveLength(0);
      expect(wrapper.find(NoSpacesPlaceholder)).toHaveLength(0);
    });
  });
});
