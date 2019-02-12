import * as actionCreators from './actionCreators.es6';
import * as actions from './actions.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';

import createMockStore from 'redux/utils/createMockStore.es6';
import { mockEndpoint } from 'data/EndpointFactory.es6';

jest.mock('data/CMA/ProductCatalog.es6', function() {
  return {
    getOrgFeature: jest.fn().mockResolvedValue(true)
  };
});

jest.mock('data/OrganizationStatus.es6', function() {
  return {
    getOrganizationStatusV1: jest
      .fn()
      .mockResolvedValue({ isPaid: true, isEnterprise: true, pricingVersion: 1 }),
    getOrganizationStatusV2: jest
      .fn()
      .mockResolvedValue({ isPaid: false, isEnterprise: false, pricingVersion: 2 })
  };
});

jest.mock('redux/selectors/getToken.es6', () => () => ({
  organization: [
    { pricingVersion: 'pricing_version_1', sys: { id: 'v1OrgId' } },
    { pricingVersion: 'pricing_version_2', sys: { id: 'v2OrgId' } }
  ]
}));

const catalogFeaturesResult = actionCreators.catalogFeatures.reduce((memo, feature) => {
  memo[feature.key] = true;
  return memo;
}, {});

describe('Org constants redux action creators', () => {
  let mockStore;

  beforeEach(() => {
    mockStore = createMockStore();
    mockEndpoint.mockReset();
  });

  it('should go through the success flow for v2 orgs', async () => {
    await mockStore.dispatch(actionCreators.fetchOrgConstants('v2OrgId'));

    expect(mockStore.getActions()).toEqual([
      {
        type: actions.ORG_CONSTANTS_PENDING,
        payload: { orgId: 'v2OrgId' }
      },
      {
        type: actions.ORG_CONSTANTS_SUCCESS,
        payload: {
          orgId: 'v2OrgId',
          data: {
            pricingVersion: 2,
            isPaid: false,
            isEnterprise: false,
            isLegacy: false,
            catalogFeatures: catalogFeaturesResult
          }
        }
      }
    ]);
  });

  it('should go through the success flow for v1 orgs', async () => {
    await mockStore.dispatch(actionCreators.fetchOrgConstants('v1OrgId'));

    expect(mockStore.getActions()).toEqual([
      {
        type: actions.ORG_CONSTANTS_PENDING,
        payload: { orgId: 'v1OrgId' }
      },
      {
        type: actions.ORG_CONSTANTS_SUCCESS,
        payload: {
          orgId: 'v1OrgId',
          data: {
            pricingVersion: 1,
            isPaid: true,
            isEnterprise: true,
            isLegacy: true,
            catalogFeatures: catalogFeaturesResult
          }
        }
      }
    ]);
  });

  it('should go through the failure flow if the endpoint errors', () => {
    const error = new Error('Something bad happened');
    const orgId = '123';

    mockEndpoint.mockRejectedValueOnce(error);

    mockStore.dispatch(actionCreators.fetchOrgConstants(orgId)).then(() => {
      expect(mockStore.getActions()).toEqual([
        {
          type: actions.ORG_CONSTANTS_PENDING,
          payload: { orgId }
        },
        {
          type: actions.ORG_CONSTANTS_FAILURE,
          payload: { orgId, error }
        }
      ]);
    });
  });

  it('should set the default values if the product catalog is not available', async () => {
    getOrgFeature.mockReset();
    await mockStore.dispatch(actionCreators.fetchOrgConstants('v1OrgId'));

    actionCreators.catalogFeatures.forEach((feature, index) => {
      expect(getOrgFeature).toHaveBeenNthCalledWith(
        index + 1,
        'v1OrgId',
        feature.key,
        feature.defaultValue
      );
    });
  });

  it('should not dispatch any action if the org constants are already in the store', async () => {
    mockStore.setState({
      orgConstants: {
        v1OrgId: {}
      }
    });

    await mockStore.dispatch(actionCreators.fetchOrgConstants('v1OrgId'));

    expect(mockStore.getActions()).toEqual([]);
  });
});
