import { createIsolatedSystem } from 'test/helpers/system-js';
import createMockSpaceEndpoint from 'helpers/mocks/SpaceEndpoint';

import { set, values } from 'lodash';

describe('ResourceService', function () {
  beforeEach(function* () {
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

    this.spies = {};
    this.stubs = {};
    this.flags = {
      'feature-bv-2018-01-resources-api': true
    };

    this.isPromiseLike = function (object) {
      return typeof object.then === 'function' &&
        typeof object.catch === 'function' &&
        typeof object.finally === 'function';
    };

    const system = createIsolatedSystem();

    const mockedEndpoint = createMockSpaceEndpoint();
    this.resourceStore = mockedEndpoint.stores.resources;

    set(this.resourceStore, 'entries', this.createResources(['entries'], [{
      maximum: 2500,
      included: 2000
    }], [400]));
    set(this.resourceStore, 'locales', this.createResources(['locales'], [{
      maximum: 10,
      included: 5
    }], [2]));

    // Spying on both the endpoint creation and the actual endpoint
    // calls are important.
    this.spies.spaceEndpoint = sinon.spy(mockedEndpoint.request);
    const createSpaceEndpoint = () => {
      return this.spies.spaceEndpoint;
    };

    this.spies.createSpaceEndpoint = sinon.spy(createSpaceEndpoint);
    this.stubs.createOrganizationEndpoint = sinon.stub();
    system.set('data/Endpoint', {
      createSpaceEndpoint: this.spies.createSpaceEndpoint,
      createOrganizationEndpoint: this.stubs.createOrganizationEndpoint
    });

    this.usages = {};
    this.limits = {};
    this.stubs.getUsage = sinon.stub().callsFake((resourceType) => {
      return this.usages[resourceType];
    });
    this.stubs.getLimit = sinon.stub().callsFake((resourceType) => {
      return this.limits[resourceType];
    });

    system.set('enforcements', {
      getUsage: this.stubs.getUsage,
      getLimit: this.stubs.getLimit
    });

    system.set('Authentication', {

    });

    system.set('utils/LaunchDarkly', {
      getCurrentVariation: flagName => {
        return Promise.resolve(this.flags[flagName]);
      }
    });

    this.createResourceService = (yield system.import('services/ResourceService')).default;
    this.ResourceService = this.createResourceService('1234');
  });

  it('should by default use the space endpoint for instantiation', function () {
    // Reset the spy
    this.spies.createSpaceEndpoint.reset();

    this.createResourceService('1234');

    expect(this.spies.createSpaceEndpoint.calledOnce).toBe(true);
    expect(this.stubs.createOrganizationEndpoint.calledOnce).toBe(false);
  });

  it('should optionally allow instantiation using the "organization" type parameter value', function () {
    this.spies.createSpaceEndpoint.reset();

    this.createResourceService('1234', 'organization');

    expect(this.stubs.createOrganizationEndpoint.calledOnce).toBe(true);
    expect(this.spies.createSpaceEndpoint.calledOnce).toBe(false);
  });

  it('should return the expected object definition', function () {
    expect(Object.keys(this.ResourceService).length).toBe(5);
    expect(this.ResourceService.get).toBeDefined();
    expect(this.ResourceService.getAll).toBeDefined();
    expect(this.ResourceService.canCreate).toBeDefined();
    expect(this.ResourceService.messagesFor).toBeDefined();
    expect(this.ResourceService.messages).toBeDefined();
  });

  describe('#get', function () {
    it('should throw if a resource type is not supplied', function () {
      expect(this.ResourceService.get).toThrow();
    });

    it('should return a promise-like object if called with a resource type', function () {
      expect(this.isPromiseLike(this.ResourceService.get('entries'))).toBe(true);
    });


    it('should return data from the endpoint if the feature flag is true', function* () {
      this.flags['feature-bv-2018-01-resources-api'] = true;

      yield this.ResourceService.get('entries');
      expect(this.spies.spaceEndpoint.calledOnce).toBe(true);
    });

    it('should return data from the token, via enforcements, if the feature flag is false', function* () {
      this.flags['feature-bv-2018-01-resources-api'] = false;

      yield this.ResourceService.get('entries');
      expect(this.stubs.getUsage.calledOnce).toBe(true);
      expect(this.stubs.getLimit.calledOnce).toBe(true);
    });

    it('should return an item that looks like a Resource regardless of the feature flag', function* () {
      let locales;
      this.flags['feature-bv-2018-01-resources-api'] = true;

      locales = yield this.ResourceService.get('locales');
      expect(locales.usage).toBeDefined();
      expect(locales.limits.included).toBeDefined();
      expect(locales.limits.maximum).toBeDefined();

      this.flags['feature-bv-2018-01-resources-api'] = false;

      // Setup the "token" limit and usage
      this.usages['locales'] = 2;
      this.limits['locales'] = 10;

      locales = yield this.ResourceService.get('locales');
      expect(locales.usage).toBeDefined();
      expect(locales.limits.included).toBeDefined();
      expect(locales.limits.maximum).toBeDefined();
    });
  });

  describe('#getAll', function () {
    beforeEach(function () {
      /*
        The way this (setting items for getAll) is handled is a little bit funky,
        due to the way that the mocked spaceEndpoint logic works. It doesn't do
        any kind of special logic when returning values, just either returning from
        the store if given a specific path id (e.g. [ 'resources', 'entries' ]), or
        returning all values in the store if given no specific path id (e.g. [ 'resources' ]).

        This should be changed in the future but it's outside of the scope of the
        work that initially created these tests.
       */

      delete this.resourceStore.entries;
      delete this.resourceStore.locales;

      set(this.resourceStore, 'entries', this.createResource(
        'entries',
        {
          maximum: 2500,
          included: 2000
        }, 2500
      ));
      set(this.resourceStore, 'locales', this.createResource(
        'locales',
        {
          maximum: 10,
          included: 5
        }, 2
      ));
    });

    it('should return a promise-like object', function () {
      expect(this.isPromiseLike(this.ResourceService.getAll())).toBe(true);
    });

    it('should always return data via the endpoint, regardless of the feature flag', function* () {
      this.flags['feature-bv-2018-01-resources-api'] = true;

      yield this.ResourceService.getAll();
      expect(this.spies.spaceEndpoint.calledOnce).toBe(true);

      this.flags['feature-bv-2018-01-resources-api'] = false;

      yield this.ResourceService.getAll();
      expect(this.spies.spaceEndpoint.calledTwice).toBe(true);
    });

    it('should return an array with multiple Resource items', function* () {
      const resources = yield this.ResourceService.getAll();

      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBe(2);
    });
  });

  describe('#canCreate', function () {
    it('should return a promise-like object', function () {
      expect(this.isPromiseLike(this.ResourceService.canCreate('locales'))).toBe(true);
    });

    it('should return true if the maximum limit is not reached', function* () {
      const status = yield this.ResourceService.canCreate('entries');
      expect(status).toBe(true);
    });

    it('should return false if the maximum limit is reached', function* () {
      set(this.resourceStore, 'entries', this.createResources(['entries'], [{
        maximum: 2500,
        included: 2000
      }], [2500]));

      const status = yield this.ResourceService.canCreate('entries');
      expect(status).toBe(false);
    });
  });

  describe('#messagesFor', function () {
    it('should return a promise-like object', function () {
      expect(this.isPromiseLike(this.ResourceService.messagesFor('locale'))).toBe(true);
    });

    it('should return an object that contains `warning` and `error` keys', function* () {
      const messages = yield this.ResourceService.messagesFor('entries');
      expect(Object.keys(messages)).toContain('warning');
      expect(Object.keys(messages)).toContain('error');
    });

    it('should return a warning if the included limit is, but the maximum limit is not, reached', function* () {
      set(this.resourceStore, 'entries', this.createResources(['entries'], [{
        maximum: 2500,
        included: 2000
      }], [2100]));

      const messages = yield this.ResourceService.messagesFor('entries');
      expect(messages.warning).toBeDefined();
      expect(messages.error).not.toBeDefined();
    });

    it('should return an error if the maximum limit is reached', function* () {
      set(this.resourceStore, 'entries', this.createResources(['entries'], [{
        maximum: 2500,
        included: 2000
      }], [2500]));

      const messages = yield this.ResourceService.messagesFor('entries');
      expect(messages.warning).toBeDefined();
      expect(messages.error).toBeDefined();
    });
  });

  describe('#messages', function () {
    beforeEach(function () {
      // See #getAll for explanation of this logic
      delete this.resourceStore.entries;
      delete this.resourceStore.locales;

      set(this.resourceStore, 'entries', this.createResource(
        'entries',
        {
          maximum: 2500,
          included: 2000
        }, 2500
      ));
      set(this.resourceStore, 'locales', this.createResource(
        'locales',
        {
          maximum: 10,
          included: 5
        }, 2
      ));
      set(this.resourceStore, 'content_types', this.createResource(
        'content_types',
        {
          maximum: 20,
          included: 10
        }, 14
      ));
    });

    it('should return a promise-like object', function () {
      expect(this.isPromiseLike(this.ResourceService.messages())).toBe(true);
    });

    it('should return an array of objects that match the #messagesFor object definition', function* () {
      const messages = yield this.ResourceService.messages();

      values(messages).forEach(message => {
        expect(Object.keys(message)).toContain('warning');
        expect(Object.keys(message)).toContain('error');
      });
    });

    it('should return a different array depending on different limits of the resources', function* () {
      const messages = yield this.ResourceService.messages();

      // Entries
      expect(messages.entries.warning).toBeDefined();
      expect(messages.entries.error).toBeDefined();

      // Locales
      expect(messages.locales.warning).not.toBeDefined();
      expect(messages.locales.error).not.toBeDefined();

      // Content Types
      expect(messages.content_types.warning).toBeDefined();
      expect(messages.content_types.error).not.toBeDefined();
    });
  });
});
