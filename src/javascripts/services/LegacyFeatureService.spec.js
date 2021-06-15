import createMockSpaceEndpoint from '__mocks__/createSpaceEndpointMock';
import { set } from 'lodash';

import createLegacyFeatureService from 'services/LegacyFeatureService';

import * as EndpointFactory from 'data/EndpointFactory';
import * as TokenStore from 'services/TokenStore';

jest.mock('utils/ResourceUtils');
jest.mock('data/EndpointFactory');
jest.mock('services/TokenStore');

describe('Legacy Feature Service', () => {
  let mocks, stubs, spies, FeatureService;
  beforeEach(async function () {
    mocks = {
      legacyOrganization: null,
      organization: {
        subscriptionPlan: {
          limits: {
            features: {
              customRoles: true,
              multipleLocales: false,
            },
          },
        },
      },
    };

    mocks.space = {
      organization: mocks.organization,
    };

    stubs = {};
    spies = {};

    // Spying on both the endpoint creation and the actual endpoint
    // calls are important.
    const mockedEndpoint = createMockSpaceEndpoint();

    set(mockedEndpoint.stores.features, 'custom_roles', {
      name: 'Custom Roles',
      sys: {
        id: 'custom_roles',
        type: 'Feature',
      },
    });
    set(mockedEndpoint.stores.features, 'multiple_locales', {
      name: 'Multiple Locales',
      sys: {
        id: 'multiple_locales',
        type: 'Feature',
      },
    });

    spies.spaceEndpoint = jest.fn(mockedEndpoint.request);
    const createSpaceEndpoint = () => {
      return spies.spaceEndpoint;
    };

    spies.createSpaceEndpoint = jest.fn(createSpaceEndpoint);
    stubs.createOrganizationEndpoint = jest.fn();

    EndpointFactory.createSpaceEndpoint = spies.createSpaceEndpoint;
    EndpointFactory.createOrganizationEndpoint = stubs.createOrganizationEndpoint;

    TokenStore.getSpace = jest.fn().mockResolvedValue(mocks.space);
    TokenStore.getOrganization = jest.fn().mockResolvedValue(mocks.organization);
  });

  it('should use the space endpoint by default during instantiation', function () {
    createLegacyFeatureService('1234');

    expect(spies.createSpaceEndpoint).toHaveBeenCalled();
    expect(stubs.createOrganizationEndpoint).not.toHaveBeenCalled();
  });

  it('should also allow instantiating with the organization type', function () {
    createLegacyFeatureService('1234', 'organization');

    expect(spies.createSpaceEndpoint).not.toHaveBeenCalled();
    expect(stubs.createOrganizationEndpoint).toHaveBeenCalled();
  });

  it('should return the proper definition on instantiation', function () {
    const FeatureService = createLegacyFeatureService('1234');

    expect(Object.keys(FeatureService)).toHaveLength(2);
    expect(FeatureService.get).toBeDefined();
    expect(FeatureService.getAll).toBeDefined();
  });

  describe('#get', () => {
    beforeEach(function () {
      FeatureService = createLegacyFeatureService('1234');
    });

    it('should return true if feature is enabled from the endpoint if org is not legacy', async function () {
      let feature;

      mocks.legacyOrganization = false;

      feature = await FeatureService.get('multipleLocales');
      expect(feature).toEqual(true);

      feature = await FeatureService.get('sso');
      expect(feature).toEqual(false);
    });

    it('should return false if the feature is not found', async function () {
      let feature;

      mocks.legacyOrganization = true;
      feature = await FeatureService.get('missing');

      expect(feature).toEqual(false);

      mocks.legacyOrganization = false;
      feature = await FeatureService.get('missing2');

      expect(feature).toEqual(false);
    });
  });

  describe('#getAll', () => {
    beforeEach(function () {
      FeatureService = createLegacyFeatureService('1234');
    });

    it('should return all features from the endpoint if org is not legacy', async function () {
      mocks.legacyOrganization = false;

      const features = await FeatureService.getAll();
      expect(features).toHaveLength(2);
      expect(features).toEqual([
        {
          name: 'Custom Roles',
          sys: {
            id: 'custom_roles',
            type: 'Feature',
          },
        },
        {
          name: 'Multiple Locales',
          sys: {
            id: 'multiple_locales',
            type: 'Feature',
          },
        },
      ]);
    });
  });
});
