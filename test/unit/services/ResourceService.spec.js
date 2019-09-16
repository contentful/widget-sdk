import sinon from 'sinon';
import createMockSpaceEndpoint from 'test/utils/createSpaceEndpointMock';
import { get, set, values } from 'lodash';
import { it } from 'test/utils/dsl';

describe('ResourceService', () => {
  beforeEach(async function() {
    this.createResource = (type, limits, usage) => {
      const { maximum, included } = limits;

      return {
        name: type,
        kind: 'permanent',
        usage,
        limits: {
          included,
          maximum
        },
        sys: {
          id: type,
          type: 'SpaceResource'
        }
      };
    };

    this.createResources = (types, limits, usages) => {
      const resources = types.map((type, i) => {
        return this.createResource(type, limits[i], usages[i]);
      });

      return {
        total: resources.length,
        limit: 25,
        skip: 0,
        sys: {
          type: 'Array'
        },
        items: resources
      };
    };

    this.called = {};

    const usages = {};
    const limits = {};
    const handler = {
      get: (target, name) => {
        if (name === 'called') {
          return target.called;
        }

        const current = get(target, 'called') || 0;

        set(target, 'called', current + 1);

        return target[name];
      }
    };

    this.usages = new Proxy(usages, handler);
    this.limits = new Proxy(limits, handler);

    this.mocks = {
      organization: {
        subscriptionPlan: {
          limits: {
            permanent: this.limits,
            period: {}
          }
        },
        usage: {
          permanent: this.usages,
          period: {}
        },
        pricingVersion: 'pricing_version_2'
      }
    };
    this.mocks.space = {
      organization: this.mocks.organization
    };

    this.spies = {};
    this.stubs = {};

    this.isPromiseLike = object =>
      typeof object.then === 'function' &&
      typeof object.catch === 'function' &&
      typeof object.finally === 'function';

    const mockedEndpoint = createMockSpaceEndpoint();
    this.resourceStore = mockedEndpoint.stores.resources;

    // Reached no limit
    set(
      this.resourceStore,
      'locale',
      this.createResource(
        'locale',
        {
          maximum: 10,
          included: 5
        },
        2
      )
    );

    // Reached included
    set(
      this.resourceStore,
      'content_type',
      this.createResource(
        'content_type',
        {
          maximum: 20,
          included: 10
        },
        14
      )
    );

    // Reached max
    set(
      this.resourceStore,
      'entry',
      this.createResource(
        'entry',
        {
          maximum: 2500,
          included: 2000
        },
        2500
      )
    );

    // Spying on both the endpoint creation and the actual endpoint
    // calls are important.
    this.spies.spaceEndpoint = sinon.spy(mockedEndpoint.request);
    const createSpaceEndpoint = () => {
      return this.spies.spaceEndpoint;
    };

    this.spies.createSpaceEndpoint = sinon.spy(createSpaceEndpoint);
    this.stubs.createOrganizationEndpoint = sinon.stub();

    this.system.set('data/EndpointFactory.es6', {
      createSpaceEndpoint: this.spies.createSpaceEndpoint,
      createOrganizationEndpoint: this.stubs.createOrganizationEndpoint
    });

    this.system.set('Authentication.es6', {});
    this.system.set('services/TokenStore.es6', {
      getSpace: sinon.stub().resolves(this.mocks.space),
      getOrganization: sinon.stub().resolves(this.mocks.organization)
    });
    this.system.set('data/EndpointFactory.es6', {
      createSpaceEndpoint: this.spies.createSpaceEndpoint,
      createOrganizationEndpoint: this.stubs.createOrganizationEndpoint
    });
    this.system.set('Authentication.es6', {});
    this.system.set('services/TokenStore.es6', {
      getSpace: sinon.stub().resolves(this.mocks.space),
      getOrganization: sinon.stub().resolves(this.mocks.organization)
    });

    this.createResourceService = (await this.system.import('services/ResourceService.es6')).default;
    this.ResourceService = this.createResourceService('1234');
  });

  it('should by default use the space endpoint for instantiation', function() {
    // Reset the spy
    this.spies.createSpaceEndpoint.reset();

    this.createResourceService('1234');

    expect(this.spies.createSpaceEndpoint.calledOnce).toBe(true);
    expect(this.stubs.createOrganizationEndpoint.calledOnce).toBe(false);
  });

  // Skipped until we support separate organization and space endpoint usage
  it('should optionally allow instantiation using the "organization" type parameter value', function() {
    this.spies.createSpaceEndpoint.reset();

    this.createResourceService('1234', 'organization');

    expect(this.stubs.createOrganizationEndpoint.calledOnce).toBe(true);
    expect(this.spies.createSpaceEndpoint.calledOnce).toBe(false);
  });

  it('should return the expected object definition', function() {
    expect(Object.keys(this.ResourceService).length).toBe(6);
    expect(this.ResourceService.get).toBeDefined();
    expect(this.ResourceService.getAll).toBeDefined();
    expect(this.ResourceService.canCreate).toBeDefined();
    expect(this.ResourceService.messagesFor).toBeDefined();
    expect(this.ResourceService.messages).toBeDefined();
    expect(this.ResourceService.canCreateEnvironmentResources).toBeDefined();
  });

  describe('#get', () => {
    it('should return a failed Promise if not supplied with any arguments', async function() {
      try {
        await this.ResourceService.get();
      } catch (e) {
        expect(e).toBeDefined();
        expect(e instanceof Error).toBe(true);
      }
    });

    it('should return a successful Promise if supplied with valid arguments', async function() {
      const getPromise = this.ResourceService.get('entry');

      expect(getPromise).toBeInstanceOf(Promise);
    });

    it('should return data from the endpoint if the pricing version is "pricing_version_2"', async function() {
      this.mocks.organization.pricingVersion = 'pricing_version_2';

      await this.ResourceService.get('entry');
      expect(this.spies.spaceEndpoint.calledOnce).toBe(true);
    });

    it('should return data from the token, via TokenStore, if the pricing version is "pricing_version_1"', async function() {
      this.mocks.organization.pricingVersion = 'pricing_version_1';

      await this.ResourceService.get('entry');

      expect(this.usages.called).toBeTruthy();
      expect(this.limits.called).toBeTruthy();
    });

    it('should return an item that looks like a Resource regardless', async function() {
      let locales;

      this.mocks.organization.pricingVersion = 'pricing_version_2';

      locales = await this.ResourceService.get('locale');
      expect(locales.usage).toBeDefined();
      expect(locales.limits.included).toBeDefined();
      expect(locales.limits.maximum).toBeDefined();

      this.mocks.organization.pricingVersion = 'pricing_version_1';

      // Setup the "token" limit and usage
      this.usages['locale'] = 2;
      this.limits['locale'] = 10;

      locales = await this.ResourceService.get('locale');
      expect(locales.usage).toBeDefined();
      expect(locales.limits.included).toBeDefined();
      expect(locales.limits.maximum).toBeDefined();
    });
  });

  describe('#getAll', () => {
    it('should return a promise-like object', function() {
      expect(this.isPromiseLike(this.ResourceService.getAll())).toBe(true);
    });

    it('should always return data via the endpoint, regardless of the pricing version', async function() {
      this.mocks.organization.pricingVersion = 'pricing_version_2';

      await this.ResourceService.getAll();
      expect(this.spies.spaceEndpoint.calledOnce).toBe(true);

      this.mocks.organization.pricingVersion = 'pricing_version_1';

      await this.ResourceService.getAll();
      expect(this.spies.spaceEndpoint.calledTwice).toBe(true);
    });

    it('should return an array with multiple Resource items', async function() {
      const resources = await this.ResourceService.getAll();

      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBe(3);
    });
  });

  describe('#canCreate', () => {
    it('should return a promise-like object', function() {
      expect(this.isPromiseLike(this.ResourceService.canCreate('locale'))).toBe(true);
    });

    it('should return true if the maximum limit is not reached', async function() {
      let status;

      status = await this.ResourceService.canCreate('contentType');
      expect(status).toBe(true);

      status = await this.ResourceService.canCreate('locale');
      expect(status).toBe(true);
    });

    it('should return false if the maximum limit is reached', async function() {
      const status = await this.ResourceService.canCreate('entry');
      expect(status).toBe(false);
    });
  });

  describe('#canCreateEnvironmentResources', () => {
    it('should return a promise-like object', function() {
      expect(this.isPromiseLike(this.ResourceService.canCreateEnvironmentResources('envId'))).toBe(
        true
      );
    });
  });

  describe('#messagesFor', () => {
    it('should return a promise-like object', function() {
      expect(this.isPromiseLike(this.ResourceService.messagesFor('locale'))).toBe(true);
    });

    it('should return an object that contains `warning` and `error` keys', async function() {
      const messages = await this.ResourceService.messagesFor('locale');
      expect(Object.keys(messages)).toContain('warning');
      expect(Object.keys(messages)).toContain('error');
    });

    it('should return a warning if the included limit is, but the maximum limit is not, reached', async function() {
      const messages = await this.ResourceService.messagesFor('contentType');
      expect(messages.warning).toBeDefined();
      expect(messages.error).toBe('');
    });

    it('should return an error if the maximum limit is reached', async function() {
      const messages = await this.ResourceService.messagesFor('entry');
      expect(messages.warning).toBe('');
      expect(messages.error).toBeDefined();
    });
  });

  describe('#messages', () => {
    it('should return a promise-like object', function() {
      expect(this.isPromiseLike(this.ResourceService.messages())).toBe(true);
    });

    it('should return an array of objects that match the #messagesFor object definition', async function() {
      const messages = await this.ResourceService.messages();

      values(messages).forEach(message => {
        expect(Object.keys(message)).toContain('warning');
        expect(Object.keys(message)).toContain('error');
      });
    });

    it('should return a different array depending on different limits of the resources', async function() {
      const messages = await this.ResourceService.messages();

      // Entries
      expect(messages.entry.warning).toBeDefined();
      expect(messages.entry.error).toBeDefined();

      // Locales
      expect(messages.locale.warning).toBe('');
      expect(messages.locale.error).toBe('');

      // Content Types
      expect(messages.contentType.warning).toBeDefined();
      expect(messages.contentType.error).toBe('');
    });
  });
});
