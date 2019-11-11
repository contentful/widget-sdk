import sinon from 'sinon';
import { stubAll } from 'test/utils/sinon';
import _ from 'lodash';
import createMockSpaceEndpoint from 'test/utils/createSpaceEndpointMock';
import { $initialize, $inject, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('spaceContext', () => {
  beforeEach(async function() {
    this.organization = { sys: { id: 'ORG_ID' } };
    this.AccessChecker = { setSpace: sinon.stub() };
    this.ProductCatalog = { getSpaceFeature: sinon.stub().resolves(false) };
    this.mockSpaceEndpoint = createMockSpaceEndpoint();
    this.initEnforcements = sinon.stub().returns(function() {});

    this.userCache = {};
    this.createUserCache = sinon.stub().returns(this.userCache);
    this.ProductCatalog = { getSpaceFeature: sinon.stub().resolves(false) };

    this.default_locale = { internal_code: 'xx' };
    this.localeStore = {
      init: sinon.stub(),
      getDefaultLocale: sinon.stub().returns(this.default_locale)
    };

    this.stubs = {
      sharejs_Connection_create: sinon.stub().returns({
        close: sinon.stub()
      }),
      DocumentPool_create: sinon.stub().returns({
        // close: sinon.stub(),
        destroy: sinon.stub()
      })
    };

    this.system.set('widgets/ExtensionLoader.es6', { createExtensionLoader: sinon.stub() });
    this.system.set('access_control/AccessChecker', this.AccessChecker);
    this.system.set('data/Endpoint.es6', {
      createSpaceEndpoint: () => this.mockSpaceEndpoint.request,
      createOrganizationEndpoint: sinon.stub(),
      createAppDefinitionsEndpoint: sinon.stub()
    });
    this.system.set('data/UiConfig/Store.es6', {
      default: sinon.stub().resolves({ store: true })
    });
    this.system.set('services/EnforcementsService.es6', {
      init: this.initEnforcements
    });
    this.system.set('data/userCache.es6', {
      default: this.createUserCache
    });
    this.system.set('data/sharejs/Connection.es6', {
      create: sinon.stub()
    });
    this.system.set('services/localeStore.es6', {
      default: this.localeStore
    });

    this.system.set('data/sharejs/Connection.es6', {
      create: this.stubs.sharejs_Connection_create
    });

    this.system.set('data/sharejs/DocumentPool.es6', {
      create: this.stubs.DocumentPool_create
    });

    this.system.set('data/CMA/ProductCatalog.es6', this.ProductCatalog);

    this.system.set('services/client.es6', {
      default: {
        newSpace: makeClientSpaceMock
      }
    });

    this.LD = await this.system.import('utils/LaunchDarkly/index.es6');
    this.LD._setFlag('feature-dv-11-2017-environments', true);

    await $initialize(this.system);

    this.spaceContext = $inject('spaceContext');
    await this.spaceContext.init();

    this.makeSpaceData = (spaceId = 'hello', organizationId = 'orgid') => ({
      sys: {
        id: spaceId
      },
      organization: {
        sys: {
          type: 'Link',
          linkType: 'Organization',
          id: organizationId
        }
      },
      spaceMember: {}
    });

    this.resetWithSpace = function(extraSpaceData = this.makeSpaceData()) {
      this.spaceContext.resetWithSpace(extraSpaceData);
      $apply();
      return this.spaceContext.space;
    };
  });

  describe('#purge', () => {
    it('gets rid of all space-related data', function() {
      const sc = this.spaceContext;
      sc.purge();

      ['space', 'users'].forEach(field => {
        expect(sc[field]).toEqual(null);
      });
    });
  });

  describe('#resetWithSpace()', () => {
    beforeEach(function() {
      this.reset = async () => {
        this.result = this.spaceContext.resetWithSpace(this.makeSpaceData());
        this.space = this.spaceContext.space;
        return this.result;
      };
      this.reset(this);
    });

    it('sets client space on context', function() {
      expect(this.spaceContext.space.data.sys.id).toEqual('hello');
    });

    it('creates environment aware space context', function() {
      expect(this.spaceContext.space.environment).toBeUndefined();
      this.spaceContext.resetWithSpace(this.makeSpaceData('withenv'), 'envid');
      expect(this.spaceContext.space.environment.sys.id).toEqual('envid');
    });

    it('creates locale repository', function() {
      expect(typeof this.spaceContext.localeRepo.getAll).toBe('function');
    });

    it('calls TheLocaleStore.init()', function() {
      sinon.assert.calledOnceWith(this.localeStore.init, this.spaceContext.localeRepo);
    });

    it('calls AccessChecker.setSpace with space data', function() {
      sinon.assert.calledOnceWith(this.AccessChecker.setSpace, this.space.data);
    });

    it('creates the user cache', function() {
      this.resetWithSpace();
      sinon.assert.calledWithExactly(this.createUserCache, this.spaceContext.endpoint);
      expect(this.spaceContext.users).toBe(this.userCache);
    });

    it('updates publishedCTs repo from refreshed CT list', function*() {
      yield this.result;
      expect(this.spaceContext.publishedCTs.getAllBare().map(ct => ct.sys.id)).toEqual(['A', 'B']);
    });

    it('always returns an array for the `environments` property even if there are no environments', async function() {
      Object.assign(this.mockSpaceEndpoint.stores.environments, null);
      await this.spaceContext.resetWithSpace(this.makeSpaceData('spaceid'));
      expect(this.spaceContext.environments).toEqual([]);
    });

    it('sets `environments` property if environments are enabled', async function() {
      const master = {
        name: 'master',
        sys: {
          id: 'master'
        }
      };
      const staging = {
        name: 'staging',
        sys: {
          id: 'staging'
        }
      };
      const environments = { master, staging };
      Object.assign(this.mockSpaceEndpoint.stores.environments, environments);

      await this.reset();

      expect(this.spaceContext.environments).toEqual([master, staging]);
    });

    it('sets `aliases` property if aliases are enabled', async function() {
      this.ProductCatalog.getSpaceFeature.resolves(true);
      const alias = {
        name: 'master',
        sys: {
          id: 'master',
          aliasedEnvironment: {
            sys: {
              id: 'prod-1'
            }
          }
        }
      };
      const prod1 = {
        name: 'prod-1',
        sys: {
          id: 'prod-1',
          aliases: [
            {
              sys: { id: 'master' }
            }
          ]
        }
      };
      const staging = {
        name: 'staging',
        sys: {
          id: 'staging',
          aliases: []
        }
      };
      const environments = { prod1, staging, alias };
      Object.assign(this.mockSpaceEndpoint.stores.environments, environments);

      await this.reset();

      expect(this.spaceContext.aliases).toEqual([alias]);
    });

    it('sets `aliases` property to empty array if aliases are not enabled', async function() {
      this.ProductCatalog.getSpaceFeature.resolves(false);
      await this.reset();

      expect(this.spaceContext.aliases).toEqual([]);
    });

    it('sets `environmentMeta` property if environments are enabled', function*() {
      const master = {
        name: 'master',
        sys: {
          id: 'master'
        }
      };
      const staging = {
        name: 'staging',
        sys: {
          id: 'staging'
        }
      };
      const environments = { master, staging };
      Object.assign(this.mockSpaceEndpoint.stores.environments, environments);
      yield this.result;
      expect(this.space.environmentMeta).toEqual({
        environmentId: 'master',
        optedIn: false,
        isMasterEnvironment: true,
        aliasId: undefined
      });
    });

    it('always returns an array for the `environments` property even if there are no environments', function() {
      this.LD._setFlag('feature-dv-11-2017-environments', false);
      Object.assign(this.mockSpaceEndpoint.stores.environments, null);
      return this.spaceContext.resetWithSpace(this.makeSpaceData('spaceid')).then(() => {
        expect(this.spaceContext.environments).toEqual([]);
        this.LD._setFlag('feature-dv-11-2017-environments', true);
        Object.assign(this.mockSpaceEndpoint.stores.environments, []);
        return this.spaceContext.resetWithSpace(this.makeSpaceData('spaceid'));
      });
    });

    it('sets alias details in `environmentMeta` property if aliases are enabled', function*() {
      this.ProductCatalog.getSpaceFeature.resolves(true);
      const master = {
        name: 'master',
        sys: {
          id: 'master'
        }
      };
      const staging = {
        name: 'staging',
        sys: {
          id: 'staging'
        }
      };
      const environments = { master, staging };
      Object.assign(this.mockSpaceEndpoint.stores.environments, environments);
      yield this.result;
      expect(this.space.environmentMeta).toEqual({
        environmentId: 'master',
        optedIn: false,
        isMasterEnvironment: true,
        aliasId: undefined
      });
    });

    it('refreshes enforcements with new space id', function() {
      sinon.assert.calledOnce(this.initEnforcements.withArgs(this.spaceContext.space.data.sys.id));
    });
  });

  describe('#getEnvironmentId()', () => {
    it('defaults to master if a space is set', function() {
      this.spaceContext.resetWithSpace(this.makeSpaceData('spaceid'));
      expect(this.spaceContext.getEnvironmentId()).toBe('master');
    });

    it('returns non-default environment ID', function() {
      this.spaceContext.resetWithSpace(this.makeSpaceData('spaceid'), 'staging');
      expect(this.spaceContext.getEnvironmentId()).toBe('staging');
    });

    it('returns undefined if a space is not set', function() {
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
        linkType: 'Alias'
      }
    };

    const masterEnv = {
      name: 'master',
      sys: {
        id: 'master',
        type: 'Link',
        linkType: 'Environment'
      }
    };

    const stagingEnv = {
      name: 'staging',
      sys: {
        id: 'staging',
        type: 'Link',
        linkType: 'Environment'
      }
    };

    it('Finds current environment to be master', function() {
      expect(this.spaceContext.isMasterEnvironment()).toBe(true);
    });

    it('Finds an Alias to be master', function() {
      expect(this.spaceContext.isMasterEnvironment(masterAlias)).toBe(true);
    });

    it('Finds an Environment to be master', function() {
      expect(this.spaceContext.isMasterEnvironment(masterEnv)).toBe(true);
    });

    it('Does not find an Environment named staging to be master', function() {
      expect(this.spaceContext.isMasterEnvironment(stagingEnv)).toBe(false);
    });
  });

  describe('#getData() ', () => {
    beforeEach(function() {
      this.space = this.resetWithSpace();
    });

    it('returns undefined for an invalid path', function() {
      expect(this.spaceContext.getData('x.y.z')).toBeUndefined();
    });

    it('returns provided default value for an invalid path', function() {
      const obj = {};
      expect(this.spaceContext.getData('x.y.z', obj)).toBe(obj);
    });

    it('returns value if a path is correct', function() {
      const obj = {};
      this.space.data.x = { y: { z: obj } };
      expect(this.spaceContext.getData('x.y.z')).toBe(obj);
    });
  });

  describe('#entryTitle()', () => {
    let entry;
    beforeEach(function() {
      entry = {
        getContentTypeId: _.constant('CTID'),
        getType: _.constant('Entry'),
        data: {
          fields: {
            title: {
              'en-US': 'the title',
              zh: 'chinese title'
            }
          }
        }
      };
      this.space = this.resetWithSpace();
      this.space.getDefaultLocale = sinon.stub().returns('en-US');
    });

    it('fetched successfully', function() {
      this.spaceContext.publishedCTs = {
        get: sinon.stub().returns(
          makeCtMock('CTID', {
            displayField: 'title',
            fields: [{ id: 'title', type: 'Symbol' }]
          })
        )
      };
      expect(this.spaceContext.entryTitle(entry)).toBe('the title');
      expect(this.spaceContext.entryTitle(entry, 'en-US', true)).toBe('the title');
      expect(this.spaceContext.entityTitle(entry)).toBe('the title');
    });

    it('returns default locale if not localized', function() {
      this.spaceContext.publishedCTs = {
        get: sinon.stub().returns(
          makeCtMock('CTID', {
            displayField: 'title',
            fields: [{ id: 'title', type: 'Symbol', localized: false }]
          })
        )
      };
      expect(this.spaceContext.entityTitle(entry, 'zh')).toBe('the title');
    });

    it('returns localized title', function() {
      this.spaceContext.publishedCTs = {
        get: sinon.stub().returns(
          makeCtMock('CTID', {
            displayField: 'title',
            fields: [{ id: 'title', type: 'Symbol', localized: true }]
          })
        )
      };

      expect(this.spaceContext.entityTitle(entry, 'zh')).toBe('chinese title');
    });

    it('gets no title, falls back to default', function() {
      this.spaceContext.publishedCTs = {
        get: sinon.stub().returns({ data: {} })
      };

      expect(this.spaceContext.entryTitle(entry)).toBe('Untitled');
      expect(this.spaceContext.entryTitle(entry, 'en-US', true)).toBe(null);
      expect(this.spaceContext.entityTitle(entry)).toBe(null);
    });

    it('handles an exception, falls back to default', function() {
      this.spaceContext.publishedCTs = {
        get: sinon.stub().returns({})
      };
      expect(this.spaceContext.entryTitle(entry)).toBe('Untitled');
      expect(this.spaceContext.entityTitle(entry)).toBe(null);
    });

    it('fetched successfully but title is empty', function() {
      entry.data.fields.title = '   ';
      expect(this.spaceContext.entryTitle(entry)).toBe('Untitled');
      expect(this.spaceContext.entryTitle(entry, undefined, true)).toBe(null);
      expect(this.spaceContext.entityTitle(entry)).toBe(null);
    });

    it("fetched successfully but title doesn't exist", function() {
      delete entry.data.fields.title;
      expect(this.spaceContext.entryTitle(entry)).toEqual('Untitled');
      expect(this.spaceContext.entryTitle(entry, undefined, true)).toEqual(null);
      expect(this.spaceContext.entityTitle(entry)).toEqual(null);
    });
  });

  describe('#assetTitle()', () => {
    let asset;
    beforeEach(() => {
      asset = {
        getType: _.constant('Asset'),
        data: {
          fields: {
            title: {
              'en-US': 'the title'
            }
          }
        }
      };
    });

    it('fetched successfully', function() {
      expect(this.spaceContext.assetTitle(asset)).toBe('the title');
      expect(this.spaceContext.assetTitle(asset, 'en-US', true)).toBe('the title');
      expect(this.spaceContext.entityTitle(asset)).toBe('the title');
    });

    it('gets no title, falls back to default', function() {
      asset.data = { fields: {} };
      expect(this.spaceContext.assetTitle(asset)).toBe('Untitled');
      expect(this.spaceContext.assetTitle(asset, 'en-US', true)).toBe(null);
      expect(this.spaceContext.entityTitle(asset)).toBe(null);
    });

    it('handles an exception, falls back to default', function() {
      asset.data = {};
      expect(this.spaceContext.assetTitle(asset)).toBe('Untitled');
      expect(this.spaceContext.entityTitle(asset)).toBe(null);
    });

    it('fetched successfully but title is empty', function() {
      asset.data.fields.title = '   ';
      expect(this.spaceContext.assetTitle(asset)).toBe('Untitled');
      expect(this.spaceContext.entityTitle(asset)).toBe(null);
    });

    it("fetched successfully but title doesn't exist", function() {
      delete asset.data.fields.title;
      expect(this.spaceContext.assetTitle(asset)).toBe('Untitled');
      expect(this.spaceContext.entityTitle(asset)).toBe(null);
    });

    it('gets a localized field', function() {
      expect(this.spaceContext.getFieldValue(asset, 'title')).toBe('the title');
    });
  });

  describe('#displayedFieldForType()', () => {
    beforeEach(async function() {
      const CTRepo = await this.system.import('data/ContentTypeRepo/Published.es6');
      this.spaceContext.publishedCTs = stubAll(CTRepo.create());
    });

    it('returns the field', function() {
      const field = { id: 'name' };
      this.spaceContext.publishedCTs.get.returns({
        data: {
          displayField: 'name',
          fields: [field]
        }
      });
      expect(this.spaceContext.displayFieldForType('type')).toBe(field);
    });

    it('returns nothing', function() {
      const field = { id: 'name' };
      this.spaceContext.publishedCTs.get.returns({
        data: {
          displayField: 'othername',
          fields: [field]
        }
      });
      expect(this.spaceContext.displayFieldForType('type')).toBeUndefined();
    });
  });

  describe('finding entity fields', () => {
    const ASSET_LINK_XX = {
      sys: { id: 'ASSET_1' }
    };
    const ASSET_LINK_IT = {
      sys: { id: 'ASSET_2' }
    };

    beforeEach(async function() {
      this.fields = [
        { type: 'Number', id: 'NUMBER' },
        { type: 'Symbol', id: 'SYMBOL' },
        { type: 'Text', id: 'TEXT' },
        { type: 'Link', linkType: 'Entry', id: 'ENTRY' },
        { type: 'Link', linkType: 'Asset', id: 'ASSET' }
      ];
      this.ct = {
        data: {
          fields: this.fields
        }
      };

      this.entry = {
        getContentTypeId: _.constant('CTID'),
        data: {
          fields: {
            NUMBER: { xx: 'NUMBER' },
            SYMBOL: { xx: 'SYMBOL VAL', de: 'SYMBOL VAL DE' },
            TEXT: { en: 'VAL EN', xx: 'VAL', de: 'VAL DE' },
            ASSET: { xx: ASSET_LINK_XX, it: ASSET_LINK_IT }
          }
        }
      };

      const CTRepo = await this.system.import('data/ContentTypeRepo/Published.es6');
      this.spaceContext.publishedCTs = stubAll(CTRepo.create());
      this.spaceContext.publishedCTs.get.withArgs('CTID').returns(this.ct);
    });

    describe('#entityDescription()', () => {
      it('returns value of first text or symbol field, falls back to default locale', function() {
        const desc = this.spaceContext.entityDescription(this.entry);
        expect(desc).toBe('SYMBOL VAL');
      });

      it('returns value of first text or symbol field for given locale', function() {
        const desc = this.spaceContext.entityDescription(this.entry, 'de');
        expect(desc).toBe('SYMBOL VAL DE');
      });

      describe('skips potential slug fields', function() {
        beforeEach(function() {
          _.remove(this.fields, field => ['Text', 'Symbol'].includes(field.type));
          this.ct.data.fields.push({ type: 'Symbol', id: 'SLUG', name: 'slug' });
          this.entry.data.fields.SLUG = { xx: 'SLUG 1' };
          this.ct.data.fields.push({ type: 'Text', id: 'SLUG_2', name: 'Another slug-field' });
          this.entry.data.fields.SLUG_2 = { xx: 'SLUG 2' };
        });

        it('returns undefined if there is only slug text fields', function() {
          const desc = this.spaceContext.entityDescription(this.entry);
          expect(desc).toBe(undefined);
        });

        it('returns a field containing name containing "slug" without word boundary', function() {
          this.ct.data.fields.push({
            type: 'Symbol',
            id: 'SLUG_3',
            name: 'sluggish',
            localized: true
          });
          this.entry.data.fields.SLUG_3 = { xx: 'SLUGGISH', de: 'SLUGGISH DE' };
          const desc = this.spaceContext.entityDescription(this.entry);
          expect(desc).toBe('SLUGGISH');
          const descDe = this.spaceContext.entityDescription(this.entry, 'de');
          expect(descDe).toBe('SLUGGISH DE');
        });
      });

      describe('skips display field', () => {
        beforeEach(function() {
          _.remove(this.fields, field => field.id === 'TEXT');
          delete this.entry.data.fields.TEXT;
          this.ct.data.displayField = 'SYMBOL';
        });

        it('returns undefined if there is no other field', function() {
          const desc = this.spaceContext.entityDescription(this.entry);
          expect(desc).toBe(undefined);
        });

        it('returns value of the next text field', function() {
          this.ct.data.fields.push({ type: 'Text', id: 'TEXT_2' });
          this.entry.data.fields.TEXT_2 = { xx: 'VAL 2', de: 'VAL 2 DE' };

          const desc = this.spaceContext.entityDescription(this.entry);
          expect(desc).toBe('VAL 2');
          const descDe = this.spaceContext.entityDescription(this.entry, 'de');
          expect(descDe).toBe('VAL 2 DE');
        });
      });

      it('returns undefined if content type is not available', function() {
        this.spaceContext.publishedCTs.get = sinon.stub().returns(null);
        const desc = this.spaceContext.entityDescription({
          getContentTypeId: _.constant()
        });
        expect(desc).toEqual(undefined);
      });
    });

    describe('#entryImage', () => {
      beforeEach(function() {
        this.file = { details: { image: {} } };
        const asset = {};
        _.set(asset, 'data.fields.file.xx', this.file);

        this.spaceContext.space = {
          getAsset: sinon.stub()
        };

        this.spaceContext.space.getAsset
          .withArgs(ASSET_LINK_XX.sys.id)
          .resolves(asset)
          .withArgs(ASSET_LINK_IT.sys.id)
          .rejects();
      });

      it('resolves a promise with an image file', function() {
        return this.spaceContext.entryImage(this.entry).then(file => expect(file).toBe(this.file));
      });

      it('resolves a promise with an image file for given locale', function() {
        return this.spaceContext
          .entryImage(this.entry, 'xx')
          .then(file => expect(file).toBe(this.file));
      });

      it('resolves a promise with default locale`s image if unknown locale', function() {
        return this.spaceContext
          .entryImage(this.entry, 'foo')
          .then(file => expect(file).toBe(this.file));
      });

      it('resolves a promise with null if no linked asset field in CT', function() {
        _.remove(this.fields, field => field.type === 'Link');
        return this.spaceContext.entryImage(this.entry).then(file => expect(file).toBe(null));
      });

      it('resolves a promise with null if linked asset is not an image', function() {
        delete this.file.details.image;

        return this.spaceContext.entryImage(this.entry).then(file => expect(file).toBe(null));
      });

      it('resolves a promise with null if dead link for given locale', function() {
        // TODO: We might want to refine this edge case's behavior and try to load
        //       another locale's image then.
        return this.spaceContext.entryImage(this.entry, 'it').then(file => expect(file).toBe(null));
      });
    });
  });

  describe('#docConnection and #docPool', () => {
    it('creates on resetSpace', function() {
      this.resetWithSpace();
      sinon.assert.calledOnce(this.stubs.sharejs_Connection_create);
      sinon.assert.calledOnce(
        this.stubs.DocumentPool_create.withArgs(this.spaceContext.docConnection)
      );
    });

    it('cleans up on resetSpace', function() {
      const stubs = [sinon.stub(), sinon.stub()];
      this.spaceContext.docConnection = { close: stubs[0] };
      this.spaceContext.docPool = { destroy: stubs[1] };
      this.resetWithSpace();
      stubs.forEach(s => sinon.assert.calledOnce(s));
    });

    it('cleans up on purge', function() {
      const stubs = [sinon.stub(), sinon.stub()];
      this.spaceContext.docConnection = { close: stubs[0] };
      this.spaceContext.docPool = { destroy: stubs[1] };
      this.spaceContext.purge();
      stubs.forEach(s => sinon.assert.calledOnce(s));
    });
  });

  describe('#uiConfig', () => {
    it('exposes the store', function() {
      this.resetWithSpace();
      expect(_.isObject(this.spaceContext.uiConfig)).toBe(true);
    });
  });

  function makeCtMock(id, opts = {}) {
    return {
      data: {
        sys: { id },
        displayField: opts.displayField,
        fields: opts.fields || []
      },
      getId: _.constant(id),
      isDeleted: _.constant(opts.isDeleted === true),
      getName: _.constant(id)
    };
  }

  function makeClientSpaceMock(data) {
    return {
      data,
      endpoint: sinon.stub().returns({
        get: sinon.stub().rejects()
      }),
      getId: sinon.stub().returns(data.sys.id),
      getPublishedContentTypes: sinon.stub().resolves([makeCtMock('A'), makeCtMock('B')]),
      makeEnvironment: sinon.stub().callsFake(envId => {
        return { ...makeClientSpaceMock(data), environment: { sys: { id: envId } } };
      })
    };
  }
});
