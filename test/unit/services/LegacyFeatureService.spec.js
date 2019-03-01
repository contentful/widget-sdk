import { createIsolatedSystem } from 'test/helpers/system-js';
import createMockSpaceEndpoint from 'test/helpers/mocks/SpaceEndpoint';
import { set } from 'lodash';

describe('Legacy Feature Service', () => {
  beforeEach(async function() {
    this.mocks = {
      legacyOrganization: null,
      organization: {
        subscriptionPlan: {
          limits: {
            features: {
              customRoles: true,
              multipleLocales: false
            }
          }
        }
      }
    };

    this.mocks.space = {
      organization: this.mocks.organization
    };

    this.stubs = {};
    this.spies = {};

    const system = createIsolatedSystem();

    system.set('utils/ResourceUtils.es6', {
      isLegacyOrganization: () => {
        return this.mocks.legacyOrganization;
      }
    });

    // Spying on both the endpoint creation and the actual endpoint
    // calls are important.
    const mockedEndpoint = createMockSpaceEndpoint();

    set(mockedEndpoint.stores.features, 'custom_roles', {
      name: 'Custom Roles',
      sys: {
        id: 'custom_roles',
        type: 'Feature'
      }
    });
    set(mockedEndpoint.stores.features, 'multiple_locales', {
      name: 'Multiple Locales',
      sys: {
        id: 'multiple_locales',
        type: 'Feature'
      }
    });

    this.spies.spaceEndpoint = sinon.spy(mockedEndpoint.request);
    const createSpaceEndpoint = () => {
      return this.spies.spaceEndpoint;
    };

    this.spies.createSpaceEndpoint = sinon.spy(createSpaceEndpoint);
    this.stubs.createOrganizationEndpoint = sinon.stub();

    system.set('data/EndpointFactory.es6', {
      createSpaceEndpoint: this.spies.createSpaceEndpoint,
      createOrganizationEndpoint: this.stubs.createOrganizationEndpoint
    });

    system.set('services/TokenStore.es6', {
      getSpace: sinon.stub().resolves(this.mocks.space),
      getOrganization: sinon.stub().resolves(this.mocks.organization)
    });

    this.createLegacyFeatureService = (await system.import(
      'services/LegacyFeatureService.es6'
    )).default;
  });

  it('should use the space endpoint by default during instantiation', function() {
    this.createLegacyFeatureService('1234');

    expect(this.spies.createSpaceEndpoint.called).toBe(true);
    expect(this.stubs.createOrganizationEndpoint.called).toBe(false);
  });

  it('should also allow instantiating with the organization type', function() {
    this.createLegacyFeatureService('1234', 'organization');

    expect(this.spies.createSpaceEndpoint.called).toBe(false);
    expect(this.stubs.createOrganizationEndpoint.called).toBe(true);
  });

  it('should return the proper definition on instantiation', function() {
    const FeatureService = this.createLegacyFeatureService('1234');

    expect(Object.keys(FeatureService).length).toBe(2);
    expect(FeatureService.get).toBeDefined();
    expect(FeatureService.getAll).toBeDefined();
  });

  describe('#get', () => {
    beforeEach(function() {
      this.FeatureService = this.createLegacyFeatureService('1234');
    });

    it('should return true if feature is enabled from the token if org is legacy', async function() {
      this.mocks.legacyOrganization = true;

      let feature = await this.FeatureService.get('multipleLocales');
      expect(feature).toEqual(false);

      this.mocks.organization.subscriptionPlan.limits.features.multipleLocales = true;
      feature = await this.FeatureService.get('multipleLocales');
      expect(feature).toEqual(true);
    });

    it('should return true if feature is enabled from the endpoint if org is not legacy', async function() {
      let feature;

      this.mocks.legacyOrganization = false;

      feature = await this.FeatureService.get('multipleLocales');
      expect(feature).toEqual(true);

      feature = await this.FeatureService.get('sso');
      expect(feature).toEqual(false);
    });

    it('should return false if the feature is not found', async function() {
      let feature;

      this.mocks.legacyOrganization = true;
      feature = await this.FeatureService.get('missing');

      expect(feature).toEqual(false);

      this.mocks.legacyOrganization = false;
      feature = await this.FeatureService.get('missing2');

      expect(feature).toEqual(false);
    });
  });

  describe('#getAll', () => {
    beforeEach(function() {
      this.FeatureService = this.createLegacyFeatureService('1234');
    });

    it('should return all enabled features from the token if org is legacy', async function() {
      this.mocks.legacyOrganization = true;

      const features = await this.FeatureService.getAll();
      expect(features.length).toBe(1);
      expect(features).toEqual([
        {
          sys: {
            id: 'custom_roles',
            type: 'Feature'
          }
        }
      ]);
    });

    it('should return all features from the endpoint if org is not legacy', async function() {
      this.mocks.legacyOrganization = false;

      const features = await this.FeatureService.getAll();
      expect(features.length).toBe(2);
      expect(features).toEqual([
        {
          name: 'Custom Roles',
          sys: {
            id: 'custom_roles',
            type: 'Feature'
          }
        },
        {
          name: 'Multiple Locales',
          sys: {
            id: 'multiple_locales',
            type: 'Feature'
          }
        }
      ]);
    });
  });
});
