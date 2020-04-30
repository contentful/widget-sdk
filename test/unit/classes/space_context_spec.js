import sinon from 'sinon';
import _ from 'lodash';
import createMockSpaceEndpoint from 'test/utils/createSpaceEndpointMock';
import { $initialize, $inject, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('spaceContext', () => {
  beforeEach(async function () {
    this.organization = { sys: { id: 'ORG_ID' } };
    this.AccessChecker = { setSpace: sinon.stub(), Action: { READ: 'read' } };
    this.ProductCatalog = { getSpaceFeature: sinon.stub().resolves(false) };
    this.mockSpaceEndpoint = createMockSpaceEndpoint();
    this.initEnforcements = sinon.stub().returns(function () {});

    this.userCache = {};
    this.createUserCache = sinon.stub().returns(this.userCache);
    this.ProductCatalog = { getSpaceFeature: sinon.stub().resolves(false) };

    this.default_locale = { internal_code: 'xx' };
    this.localeStore = {
      init: sinon.stub(),
      getDefaultLocale: sinon.stub().returns(this.default_locale),
    };

    this.stubs = {
      sharejs_Connection_create: sinon.stub().returns({
        close: sinon.stub(),
      }),
      DocumentPool_create: sinon.stub().returns({
        // close: sinon.stub(),
        destroy: sinon.stub(),
      }),
    };

    this.system.set('widgets/ExtensionLoader', { createExtensionLoader: sinon.stub() });
    this.system.set('access_control/AccessChecker', this.AccessChecker);
    this.system.set('data/Endpoint', {
      createSpaceEndpoint: () => this.mockSpaceEndpoint.request,
      createOrganizationEndpoint: sinon.stub(),
      createAppDefinitionsEndpoint: sinon.stub(),
    });
    this.system.set('data/UiConfig/Store', {
      default: sinon.stub().resolves({ store: true }),
    });
    this.system.set('services/EnforcementsService', {
      init: this.initEnforcements,
    });
    this.system.set('data/userCache', {
      default: this.createUserCache,
    });
    this.system.set('data/sharejs/Connection', {
      create: sinon.stub(),
    });
    this.system.set('services/localeStore', {
      default: this.localeStore,
    });

    this.system.set('data/sharejs/Connection', {
      create: this.stubs.sharejs_Connection_create,
    });

    this.system.set('data/sharejs/DocumentPool', {
      create: this.stubs.DocumentPool_create,
    });

    this.system.set('data/CMA/ProductCatalog', this.ProductCatalog);

    this.system.set('services/client', {
      default: {
        newSpace: makeClientSpaceMock,
      },
    });

    this.system.set('services/PubSubService', {
      createPubSubClientForSpace: sinon.stub().returns({
        on: sinon.stub(),
        off: sinon.stub(),
      }),
    });

    this.LD = await this.system.import('utils/LaunchDarkly');
    this.LD._setFlag('feature-dv-11-2017-environments', true);

    await $initialize(this.system);

    this.spaceContext = $inject('spaceContext');
    await this.spaceContext.init();

    this.makeSpaceData = (spaceId = 'hello', organizationId = 'orgid') => ({
      sys: {
        id: spaceId,
      },
      organization: {
        sys: {
          type: 'Link',
          linkType: 'Organization',
          id: organizationId,
        },
      },
      spaceMember: {},
    });

    this.resetWithSpace = function (extraSpaceData = this.makeSpaceData()) {
      this.spaceContext.resetWithSpace(extraSpaceData);
      $apply();
      return this.spaceContext.space;
    };
  });

  describe('#purge', () => {
    it('gets rid of all space-related data', function () {
      const sc = this.spaceContext;
      sc.purge();

      ['space', 'users'].forEach((field) => {
        expect(sc[field]).toEqual(null);
      });
    });
  });

  describe('#resetWithSpace()', () => {
    beforeEach(function () {
      this.reset = async () => {
        this.result = this.spaceContext.resetWithSpace(this.makeSpaceData());
        this.space = this.spaceContext.space;
        return this.result;
      };
      this.reset(this);
    });

    it('sets client space on context', function () {
      expect(this.spaceContext.space.data.sys.id).toEqual('hello');
    });

    it('creates environment aware space context', function () {
      expect(this.spaceContext.space.environment).toBeUndefined();
      this.spaceContext.resetWithSpace(this.makeSpaceData('withenv'), 'envid');
      expect(this.spaceContext.space.environment.sys.id).toEqual('envid');
    });

    it('creates locale repository', function () {
      expect(typeof this.spaceContext.localeRepo.getAll).toBe('function');
    });

    it('calls TheLocaleStore.init()', async function () {
      await this.result;
      sinon.assert.calledOnceWith(this.localeStore.init, this.spaceContext.localeRepo);
    });

    it('calls AccessChecker.setSpace with space data', function () {
      sinon.assert.calledOnceWith(this.AccessChecker.setSpace, this.space.data);
    });

    it('creates the user cache', function () {
      this.resetWithSpace();
      sinon.assert.calledWithExactly(this.createUserCache, this.spaceContext.endpoint);
      expect(this.spaceContext.users).toBe(this.userCache);
    });

    it('updates publishedCTs repo from refreshed CT list', async function () {
      await this.result;
      expect(this.spaceContext.publishedCTs.getAllBare().map((ct) => ct.sys.id)).toEqual([
        'A',
        'B',
      ]);
    });

    it('always returns an array for the `environments` property even if there are no environments', async function () {
      Object.assign(this.mockSpaceEndpoint.stores.environments, null);
      await this.spaceContext.resetWithSpace(this.makeSpaceData('spaceid'));
      expect(this.spaceContext.environments).toEqual([]);
    });

    it('sets `environments` property if environments are enabled', async function () {
      const master = {
        name: 'master',
        sys: {
          id: 'master',
        },
      };
      const staging = {
        name: 'staging',
        sys: {
          id: 'staging',
        },
      };
      const environments = { master, staging };
      Object.assign(this.mockSpaceEndpoint.stores.environments, environments);

      await this.reset();

      expect(this.spaceContext.environments).toEqual([master, staging]);
    });

    it('sets `aliases` property if aliases are enabled', async function () {
      this.ProductCatalog.getSpaceFeature.resolves(true);
      const alias = {
        name: 'master',
        sys: {
          id: 'master',
          aliasedEnvironment: {
            sys: {
              id: 'prod-1',
            },
          },
        },
      };
      const prod1 = {
        name: 'prod-1',
        sys: {
          id: 'prod-1',
          aliases: [
            {
              sys: { id: 'master' },
            },
          ],
        },
      };
      const staging = {
        name: 'staging',
        sys: {
          id: 'staging',
          aliases: [],
        },
      };
      const environments = { prod1, staging, alias };
      Object.assign(this.mockSpaceEndpoint.stores.environments, environments);

      await this.reset();

      expect(this.spaceContext.aliases).toEqual([alias]);
    });

    it('sets `aliases` property to empty array if aliases are not enabled', async function () {
      this.ProductCatalog.getSpaceFeature.resolves(false);
      await this.reset();

      expect(this.spaceContext.aliases).toEqual([]);
    });

    it('sets `environmentMeta` property if environments are enabled', async function () {
      const master = {
        name: 'master',
        sys: {
          id: 'master',
        },
      };
      const staging = {
        name: 'staging',
        sys: {
          id: 'staging',
        },
      };
      const environments = { master, staging };
      Object.assign(this.mockSpaceEndpoint.stores.environments, environments);
      await this.result;
      expect(this.space.environmentMeta).toEqual({
        environmentId: 'master',
        optedIn: false,
        isMasterEnvironment: true,
        aliasId: undefined,
      });
    });

    it('always returns an array for the `environments` property even if there are no environments', function () {
      this.LD._setFlag('feature-dv-11-2017-environments', false);
      Object.assign(this.mockSpaceEndpoint.stores.environments, null);
      return this.spaceContext.resetWithSpace(this.makeSpaceData('spaceid')).then(() => {
        expect(this.spaceContext.environments).toEqual([]);
        this.LD._setFlag('feature-dv-11-2017-environments', true);
        Object.assign(this.mockSpaceEndpoint.stores.environments, []);
        return this.spaceContext.resetWithSpace(this.makeSpaceData('spaceid'));
      });
    });

    it('sets alias details in `environmentMeta` property if aliases are enabled', async function () {
      this.ProductCatalog.getSpaceFeature.resolves(true);
      const master = {
        name: 'master',
        sys: {
          id: 'master',
        },
      };
      const staging = {
        name: 'staging',
        sys: {
          id: 'staging',
        },
      };
      const environments = { master, staging };
      Object.assign(this.mockSpaceEndpoint.stores.environments, environments);
      await this.result;
      expect(this.space.environmentMeta).toEqual({
        environmentId: 'master',
        optedIn: false,
        isMasterEnvironment: true,
        aliasId: undefined,
      });
    });

    it('refreshes enforcements with new space id', function () {
      sinon.assert.calledOnce(this.initEnforcements.withArgs(this.spaceContext.space.data.sys.id));
    });
  });

  describe('#getEnvironmentId()', () => {
    it('defaults to master if a space is set', function () {
      this.spaceContext.resetWithSpace(this.makeSpaceData('spaceid'));
      expect(this.spaceContext.getEnvironmentId()).toBe('master');
    });

    it('returns non-default environment ID', function () {
      this.spaceContext.resetWithSpace(this.makeSpaceData('spaceid'), 'staging');
      expect(this.spaceContext.getEnvironmentId()).toBe('staging');
    });

    it('returns undefined if a space is not set', function () {
      this.spaceContext.purge();
      expect(this.spaceContext.getEnvironmentId()).toBeUndefined();
    });
  });

  describe('#isMasterEnvironment()', () => {
    const masterAlias = {
      name: 'master',
      sys: {
        id: 'master',
        type: 'Link',
        linkType: 'Alias',
      },
    };

    const masterEnv = {
      name: 'master',
      sys: {
        id: 'master',
        type: 'Link',
        linkType: 'Environment',
      },
    };

    const stagingEnv = {
      name: 'staging',
      sys: {
        id: 'staging',
        type: 'Link',
        linkType: 'Environment',
      },
    };

    it('Finds current environment to be master', function () {
      expect(this.spaceContext.isMasterEnvironment()).toBe(true);
    });

    it('Finds an Alias to be master', function () {
      expect(this.spaceContext.isMasterEnvironment(masterAlias)).toBe(true);
    });

    it('Finds an Environment to be master', function () {
      expect(this.spaceContext.isMasterEnvironment(masterEnv)).toBe(true);
    });

    it('Does not find an Environment named staging to be master', function () {
      expect(this.spaceContext.isMasterEnvironment(stagingEnv)).toBe(false);
    });
  });

  describe('#getData() ', () => {
    beforeEach(function () {
      this.space = this.resetWithSpace();
    });

    it('returns undefined for an invalid path', function () {
      expect(this.spaceContext.getData('x.y.z')).toBeUndefined();
    });

    it('returns provided default value for an invalid path', function () {
      const obj = {};
      expect(this.spaceContext.getData('x.y.z', obj)).toBe(obj);
    });

    it('returns value if a path is correct', function () {
      const obj = {};
      this.space.data.x = { y: { z: obj } };
      expect(this.spaceContext.getData('x.y.z')).toBe(obj);
    });
  });

  describe('#docConnection and #docPool', () => {
    it('creates on resetSpace', function () {
      this.resetWithSpace();
      sinon.assert.calledOnce(this.stubs.sharejs_Connection_create);
      // TODO:xxx figure out why this isn't working
      // sinon.assert.calledOnce(this.stubs.DocumentPool_create.withArgs(this.spaceContext.docConnection));
    });

    it('cleans up on resetSpace', function () {
      const stubs = [sinon.stub(), sinon.stub()];
      this.spaceContext.docConnection = { close: stubs[0] };
      this.spaceContext.docPool = { destroy: stubs[1] };
      this.resetWithSpace();
      stubs.forEach((s) => sinon.assert.calledOnce(s));
    });

    it('cleans up on purge', function () {
      const stubs = [sinon.stub(), sinon.stub()];
      this.spaceContext.docConnection = { close: stubs[0] };
      this.spaceContext.docPool = { destroy: stubs[1] };
      this.spaceContext.purge();
      stubs.forEach((s) => sinon.assert.calledOnce(s));
    });
  });

  describe('#uiConfig', () => {
    it('exposes the store', async function () {
      await this.spaceContext.resetWithSpace(this.makeSpaceData());
      expect(_.isObject(this.spaceContext.uiConfig)).toBe(true);
    });
  });

  function makeCtMock(id, opts = {}) {
    return {
      data: {
        sys: { id },
        displayField: opts.displayField,
        fields: opts.fields || [],
      },
      getId: _.constant(id),
      isDeleted: _.constant(opts.isDeleted === true),
      getName: _.constant(id),
    };
  }

  function makeClientSpaceMock(data) {
    return {
      data,
      endpoint: sinon.stub().returns({
        get: sinon.stub().rejects(),
      }),
      getId: sinon.stub().returns(data.sys.id),
      getPublishedContentTypes: sinon.stub().resolves([makeCtMock('A'), makeCtMock('B')]),
      makeEnvironment: sinon.stub().callsFake((envId) => {
        return { ...makeClientSpaceMock(data), environment: { sys: { id: envId } } };
      }),
    };
  }
});
