import * as sinon from 'test/helpers/sinon';
import _ from 'lodash';
import createMockSpaceEndpoint from 'test/helpers/mocks/SpaceEndpoint';

describe('spaceContext', () => {
  beforeEach(function() {
    this.organization = { sys: { id: 'ORG_ID' } };
    this.AccessChecker = { setSpace: sinon.stub() };
    this.mockSpaceEndpoint = createMockSpaceEndpoint();
    this.initEnforcements = sinon.stub().returns(function() {});

    this.userCache = {};
    this.createUserCache = sinon.stub().returns(this.userCache);

    module('contentful/test', $provide => {
      $provide.value('data/userCache', sinon.stub());
      $provide.value('widgets/EditorInterfaceRepo.es6', { default: sinon.stub() });
      $provide.value('access_control/AccessChecker/index.es6', this.AccessChecker);
      $provide.value('data/Endpoint.es6', {
        createSpaceEndpoint: () => this.mockSpaceEndpoint.request
      });
      $provide.value('data/UiConfig/Store.es6', {
        default: sinon.stub().resolves({ store: true })
      });
      $provide.constant('client', { newSpace: makeClientSpaceMock });
      $provide.value('widgets/WidgetStore.es6', {
        create: sinon.stub().returns({
          refresh: sinon.stub().resolves([])
        })
      });
      $provide.value('services/EnforcementsService.es6', {
        init: this.initEnforcements
      });
      $provide.constant('data/userCache', this.createUserCache);
    });

    const { registerFactory } = this.$inject('NgRegistry.es6');

    const localeStoreOrig = this.mockService('TheLocaleStore');
    localeStoreOrig.init.resolves();

    // Reregister TheLocaleStore with mocked version
    registerFactory('TheLocaleStore', () => localeStoreOrig);

    this.widgetStoreCreate = this.$inject('widgets/WidgetStore.es6').create;
    this.spaceContext = this.$inject('spaceContext');
    this.localeStore = this.$inject('TheLocaleStore');

    this.resetWithSpace = function(spaceData) {
      spaceData = spaceData || { sys: { id: 'spaceid' }, spaceMembership: {} };
      this.spaceContext.resetWithSpace(spaceData);
      this.$apply();
      return this.spaceContext.space;
    };

    const LD = this.$inject('utils/LaunchDarkly');
    LD._setFlag('feature-dv-11-2017-environments', true);
  });

  describe('#purge', () => {
    it('gets rid of all space-related data', function() {
      const sc = this.spaceContext;
      sc.purge();

      ['space', 'users', 'widgets'].forEach(field => {
        expect(sc[field]).toEqual(null);
      });
    });
  });

  describe('#resetWithSpace()', () => {
    beforeEach(function() {
      this.$inject('widgets/EditorInterfaceRepo.es6').default.returns('EI');

      const spaceData = { sys: { id: 'hello' } };
      this.result = this.spaceContext.resetWithSpace(spaceData);
      this.space = this.spaceContext.space;
    });

    it('sets client space on context', function() {
      expect(this.spaceContext.space.data.sys.id).toEqual('hello');
    });

    it('creates environment aware space context', function() {
      expect(this.spaceContext.space.environment).toBeUndefined();
      this.spaceContext.resetWithSpace({ sys: { id: 'withenv' } }, 'envid');
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

    it('creates and refreshes widget store', function() {
      sinon.assert.calledWith(this.widgetStoreCreate, this.spaceContext.cma);
      sinon.assert.calledOnce(this.spaceContext.widgets.refresh);
    });

    it('sets #eiRepo', function() {
      const createEditorInterfaceRepo = this.$inject('widgets/EditorInterfaceRepo.es6').default;
      sinon.assert.calledOnce(createEditorInterfaceRepo);
      expect(this.spaceContext.eiRepo).toEqual('EI');
    });

    it('updates publishedCTs repo from refreshed CT list', function*() {
      yield this.result;
      expect(this.spaceContext.publishedCTs.getAllBare().map(ct => ct.sys.id)).toEqual(['A', 'B']);
    });

    it('set `environments` property if environments are enabled', function*() {
      Object.assign(this.mockSpaceEndpoint.stores.environments, {
        master: 'master',
        other: 'other'
      });
      yield this.result;
      expect(this.spaceContext.environments).toEqual(['master', 'other']);
    });

    it('refreshes enforcements with new space id', function() {
      sinon.assert.calledOnce(this.initEnforcements.withArgs(this.spaceContext.space.data.sys.id));
    });
  });

  describe('#getEnvironmentId()', () => {
    it('defaults to master if a space is set', function() {
      this.spaceContext.resetWithSpace({ sys: { id: 'spaceid' } });
      expect(this.spaceContext.getEnvironmentId()).toBe('master');
    });

    it('returns non-default environment ID', function() {
      this.spaceContext.resetWithSpace({ sys: { id: 'spaceid' } }, 'staging');
      expect(this.spaceContext.getEnvironmentId()).toBe('staging');
    });

    it('returns undefined if a space is not set', function() {
      this.spaceContext.purge();
      expect(this.spaceContext.getEnvironmentId()).toBeUndefined();
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
              'en-US': 'the title'
            }
          }
        }
      };
      this.space = this.resetWithSpace();
      this.space.getDefaultLocale = sinon.stub().returns('en-US');

      const CTRepo = this.$inject('data/ContentTypeRepo/Published.es6');
      this.spaceContext.publishedCTs = sinon.stubAll(CTRepo.create());
    });

    it('fetched successfully', function() {
      this.spaceContext.publishedCTs.get.returns(
        makeCtMock('CTID', {
          displayField: 'title',
          fields: { id: 'title', type: 'Symbol' }
        })
      );
      expect(this.spaceContext.entryTitle(entry)).toBe('the title');
      expect(this.spaceContext.entryTitle(entry, 'en-US', true)).toBe('the title');
      expect(this.spaceContext.entityTitle(entry)).toBe('the title');
    });

    it('gets no title, falls back to default', function() {
      this.spaceContext.publishedCTs.get.returns({ data: {} });
      expect(this.spaceContext.entryTitle(entry)).toBe('Untitled');
      expect(this.spaceContext.entryTitle(entry, 'en-US', true)).toBe(null);
      expect(this.spaceContext.entityTitle(entry)).toBe(null);
    });

    it('handles an exception, falls back to default', function() {
      this.spaceContext.publishedCTs.get.returns({});
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
    beforeEach(function() {
      const CTRepo = this.$inject('data/ContentTypeRepo/Published.es6');
      this.spaceContext.publishedCTs = sinon.stubAll(CTRepo.create());
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

    beforeEach(function() {
      this.default_locale = { internal_code: 'xx' };
      this.spaceContext.space = {
        getDefaultLocale: sinon.stub().returns(this.default_locale)
      };

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

      const CTRepo = this.$inject('data/ContentTypeRepo/Published.es6');
      this.spaceContext.publishedCTs = sinon.stubAll(CTRepo.create());
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

      describe('skips display field', () => {
        beforeEach(function() {
          _.remove(this.fields, field => field.id === 'TEXT');
          delete this.entry.data.fields.TEXT;
          this.ct.data.displayField = 'SYMBOL';
        });

        it('returns undefined if there is not other field', function() {
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

        this.spaceContext.space.getAsset = sinon.stub();
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
    beforeEach(function() {
      const ShareJSConnection = this.$inject('data/sharejs/Connection.es6');
      const DocumentPool = this.$inject('data/sharejs/DocumentPool.es6');
      this.createConnection = ShareJSConnection.create = sinon.stub().returns({});
      this.createPool = DocumentPool.create = sinon.stub();
    });

    it('creates on resetSpace', function() {
      this.resetWithSpace();
      sinon.assert.calledOnce(this.createConnection);
      sinon.assert.calledOnce(this.createPool.withArgs(this.spaceContext.docConnection));
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
