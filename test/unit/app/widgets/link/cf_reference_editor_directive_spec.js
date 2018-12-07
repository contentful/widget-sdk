import sinon from 'sinon';
import _ from 'lodash';
import * as K from 'test/helpers/mocks/kefir';

describe('cfReferenceEditorDirective', () => {
  const template =
    '<cf-reference-editor type="{{ type }}" variant="{{ variant }}" single="single" />';
  const link1 = { sys: { type: 'Link', linkType: 'Entry', id: 'testid1' } };
  const link2 = { sys: { type: 'Link', linkType: 'Entry', id: 'testid2' } };

  beforeEach(function() {
    this.analytics = { track: sinon.spy() };

    this.spaceContext = {
      getId: () => 'some id',
      publishedCTs: {
        get: sinon.stub(),
        items$: K.createMockProperty([]),
        getAllBare: sinon.stub().returns([]),
        fetch: sinon.stub().returns([])
      }
    };

    module('contentful/test', $provide => {
      $provide.removeDirectives('cfEntityLink', 'cfAssetCard');
      $provide.value('analytics/Analytics.es6', this.analytics);
      $provide.value('spaceContext', this.spaceContext);
    });

    this.$q = this.$inject('$q');

    this.widgetApi = this.$inject('mocks/widgetApi').create();
    this.field = this.widgetApi.field;

    this.modalDialog = this.$inject('modalDialog');

    this.init = function(scopeProps) {
      scopeProps = _.defaults(scopeProps, { type: 'Entry' });
      return this.$compile(template, scopeProps, {
        cfWidgetApi: this.widgetApi
      }).isolateScope();
    };
  });

  describe('widget settings', () => {
    it('is not draggable for single references', function() {
      const scope = this.init({ single: true });
      expect(scope.config.draggable).toBe(false);
    });

    it('is draggable for multiple references', function() {
      const scope = this.init({ single: false });
      expect(scope.config.draggable).toBe(true);
    });

    it('shows details for entry cards', function() {
      const scope = this.init({ type: 'Entry', variant: 'card' });
      expect(scope.config.showDetails).toBe(true);
    });

    it('does not show details for links', function() {
      const scope = this.init({ type: 'Entry', variant: 'link' });
      expect(scope.config.showDetails).toBe(false);
    });

    it('checks if uses the asset card variant', function() {
      const scope = this.init({ type: 'Asset', variant: 'card' });
      expect(scope.isAssetCard).toBe(true);
    });

    it('determines plural name of entity type', function() {
      expect(this.init({ type: 'Entry' }).typePlural).toBe('entries');
      expect(this.init({ type: 'Asset' }).typePlural).toBe('assets');
    });
  });

  describe('syncing widget and field values', () => {
    describe('on field value change', () => {
      it('defaults to an empty array for no field value', function() {
        this.scope = this.init();
        this.field.setValue(null);
        expect(this.scope.entityModels).toEqual([]);
      });

      it('wraps and puts single links into their own arrays', function() {
        this.scope = this.init({ single: true });
        this.field.setValue(link1);
        this.$apply();
        expect(this.scope.entityModels.length).toBe(1);
        expect(this.scope.entityModels[0].value.id).toBe(link1.sys.id);
      });

      it('wraps every link in array values', function() {
        this.scope = this.init();
        this.field.setValue([link1, link2]);
        this.$apply();
        expect(this.scope.entityModels.length).toBe(2);
        expect(this.scope.entityModels[0].value.id).toBe(link1.sys.id);
        expect(this.scope.entityModels[1].value.id).toBe(link2.sys.id);
      });

      it('converts invalid links to null', function() {
        this.scope = this.init();
        this.field.setValue([
          null,
          undefined,
          {},
          { sys: null },
          { sys: {} },
          { sys: { id: 1 } },
          { sys: { id: {} } }
        ]);
        this.$apply();
        expect(this.scope.entityModels.length).toBe(7);
        this.scope.entityModels.forEach(model => expect(model.value.id).toBe(null));
      });

      it('prefetches linked entities', function() {
        this.scope = this.init();
        this.field.setValue([link1]);
        sinon.assert.calledOnce(this.widgetApi.space.getEntries);
        sinon.assert.calledWith(
          this.widgetApi.space.getEntries,
          sinon.match.has('sys.id[in]', link1.sys.id)
        );
      });
    });

    describe('on widget state changes', () => {
      beforeEach(function() {
        this.scope = this.init();
        this.field.setValue([link1, link2]);
        this.field.setValue.reset();
        this.$apply();
      });

      it('sets field value when list is rearranged', function() {
        this.scope.entityModels = _.reverse(this.scope.entityModels);
        this.scope.uiSortable.update();
        this.$apply();
        sinon.assert.calledOnce(this.field.setValue.withArgs([link2, link1]));
      });

      it('sets field value when entity is being selected', function() {
        const entity = { sys: { type: 'Entry', id: 'testid2' } };
        this.$inject('entitySelector').openFromField = sinon.stub().resolves([entity]);
        this.scope.addExisting({ preventDefault: _.noop });
        this.$apply();
        expect(this.field.setValue.firstCall.args[0]).toEqual([link1, link2, link2]);
      });

      it('sets field value when link is being removed', function() {
        this.$apply();
        this.scope.entityModels[0].value.actions.remove();
        sinon.assert.calledOnce(this.field.setValue.withArgs([link2]));
      });
    });
  });

  describe('cfReferenceEditor/createEntity()', () => {
    const createdEntity = {};

    beforeEach(function() {
      this.create = this.$inject('cfReferenceEditor/createEntity');
      this.space = this.widgetApi.space;
    });

    it('creates an asset', async function() {
      this.space.createAsset.resolves(createdEntity);

      const asset = await this.create('Asset', {}, this.space);

      expect(asset).toBe(createdEntity);
      sinon.assert.calledOnce(this.space.createAsset.withArgs({}));
    });

    describe('creating an entry', () => {
      const ct1 = { sys: { id: 'ctid', publishedVersion: 123 } };
      const ct2 = { sys: { id: 'ctid2', publishedVersion: 666 } };

      it('creates an entry if there is only one CT', async function() {
        this.space.createEntry.resolves(createdEntity);
        this.space.getContentTypes.resolves({ items: [ct1] });

        const entry = await this.create('Entry', {}, this.space);

        expect(entry).toBe(createdEntity);
        sinon.assert.calledOnce(this.space.createEntry.withArgs('ctid', {}));
      });

      it('filters out content types to adhere to single link field validation', async function() {
        this.space.getContentTypes.resolves({ items: [ct1, ct2] });
        const field = { validations: [{ linkContentType: ['ctid'] }] };

        await this.create('Entry', field, this.space);

        sinon.assert.calledOnce(this.space.createEntry.withArgs('ctid', {}));
      });

      it('filters out content types to adhere to multiple link field validation', async function() {
        this.space.getContentTypes.resolves({ items: [ct1, ct2] });
        const field = { itemValidations: [{ linkContentType: ['ctid2'] }] };

        await this.create('Entry', field, this.space);

        sinon.assert.calledOnce(this.space.createEntry.withArgs('ctid2', {}));
      });

      it('allows user to choose which CT should be used', async function() {
        this.space.createEntry.resolves(createdEntity);
        this.space.getContentTypes.resolves({ items: [ct1, ct2] });

        this.modalDialog.open = config => {
          expect(config.scopeData.cts).toEqual([ct1, ct2]);
          return { promise: this.$q.resolve(ct1) };
        };

        const entry = await this.create('Entry', {}, this.space);

        expect(entry).toBe(createdEntity);
        sinon.assert.calledOnce(this.space.createEntry.withArgs('ctid', {}));
      });
    });
  });

  describe('adding a new asset', () => {
    const ASSET = { sys: { id: 'assetid', type: 'Asset' } };

    beforeEach(async function() {
      this.field.setValue([]);
      this.widgetApi.space.createAsset.withArgs({}).resolves(ASSET);
      this.scope = this.init({ type: 'Asset' });
      await this.scope.addNewAsset();
    });

    it('adds link', function() {
      expect(this.scope.entityModels.length).toBe(1);
      expect(this.scope.entityModels[0].value.id).toBe(ASSET.sys.id);
    });

    it('redirects to entity editor after creation', function() {
      sinon.assert.calledOnceWith(this.widgetApi.state.goToEditor, ASSET);
    });

    it('does not call analytics.track()', function() {
      sinon.assert.notCalled(this.analytics.track);
    });

    itWontAddMultipleEntitiesAtOnce('assets', scope => scope.addNewAsset());
  });

  describe('adding a new entry', () => {
    const ENTRY = { sys: { id: 'entryid', type: 'Entry' } };
    const CT_ID = 'CONTENT_TYPE_ID';
    const CLIENT_CT = { data: { sys: { id: CT_ID }, fields: [{}, { localized: true }] } };

    beforeEach(async function() {
      this.field.setValue([]);
      this.spaceContext.publishedCTs.get.withArgs(CT_ID).returns(CLIENT_CT);
      this.widgetApi.space.createEntry.withArgs(CT_ID, {}).resolves(ENTRY);
      this.scope = this.init({ type: 'Entry' });
      await this.scope.addNewEntry(CT_ID);
      this.scope.$digest();
    });

    it('adds link', function() {
      expect(this.scope.entityModels.length).toBe(1);
      expect(this.scope.entityModels[0].value.id).toBe(ENTRY.sys.id);
    });

    it('redirects to entity editor after creation', function() {
      sinon.assert.calledOnceWith(this.widgetApi.state.goToEditor, ENTRY);
    });

    it('tracks `entry:create` event', function() {
      sinon.assert.calledWithExactly(this.analytics.track, 'entry:create', {
        eventOrigin: 'reference-editor',
        contentType: CLIENT_CT,
        response: { data: ENTRY }
      });
    });

    itWontAddMultipleEntitiesAtOnce('entries', scope => scope.addNewEntry(CT_ID));
  });

  describe('publication warning - unpublished references', () => {
    const validWarning = { count: 1, linked: 'Entry' };
    function makeEntity(link, published) {
      return {
        sys: {
          id: link.sys.id,
          publishedVersion: published ? 1 : undefined
        }
      };
    }

    beforeEach(function() {
      this.widgetApi.space.getEntries.defers();
      this.field.setValue([link1, link2]);
      this.scope = this.init();

      this.warning = this.widgetApi.field.registerUnpublishedReferencesWarning.firstCall.args[0];
    });

    it('registers publication warning', function() {
      sinon.assert.calledOnce(this.widgetApi.field.registerUnpublishedReferencesWarning);
      expect(this.warning.group).toBe('unpublished_references');
      expect([
        typeof this.warning.shouldShow,
        typeof this.warning.warnFn,
        typeof this.warning.getData
      ]).toEqual(['function', 'function', 'function']);
    });

    it('is shown if there are unpublished references', function() {
      this.widgetApi.space.getEntries.resolve({
        items: [makeEntity(link1, true), makeEntity(link2, false)]
      });
      this.$apply();
      expect(this.warning.shouldShow()).toBe(true);
    });

    it('is not be shown if all references are published', function() {
      this.widgetApi.space.getEntries.resolve({
        items: [makeEntity(link1, true), makeEntity(link2, true)]
      });
      this.$apply();
      expect(this.warning.shouldShow()).toBe(false);
    });

    it('should prepare warning data', function() {
      this.widgetApi.field.name = 'test';
      this.widgetApi.field.locale = 'en-US';
      this.widgetApi.space.getEntries.resolve({
        items: [makeEntity(link1, false), makeEntity(link2, false)]
      });
      this.$apply();

      const data = this.warning.getData();
      expect(data.fieldName).toBe('test (en-US)');
      expect(data.count).toBe(2);
      expect(data.linked).toBe('Entry');
      expect(data.type).toBe('entries');
    });

    it('displays only the valid warnings', function() {
      this.modalDialog.open = config => {
        expect(config.scopeData.unpublishedRefs).toEqual([validWarning]);
        expect(config.scopeData.linkedEntityTypes).toBe('entries');
        return { promise: this.$q.resolve() };
      };

      this.warning.warnFn([null, { count: 0 }, validWarning]);
    });

    it('computes title based on liked entity types', function() {
      const assetWarning = { count: 1, linked: 'Asset' };

      this.modalDialog.open = config => {
        if (config.scopeData.unpublishedRefs.length === 2) {
          expect(config.scopeData.linkedEntityTypes).toBe('entries and assets');
        } else {
          expect(config.scopeData.linkedEntityTypes).toBe('assets');
        }

        return { promise: this.$q.resolve() };
      };

      this.warning.warnFn([validWarning, assetWarning]);
      this.warning.warnFn([assetWarning]);
    });
  });

  function itWontAddMultipleEntitiesAtOnce(entityType, addEntityFn) {
    it(`won't add multiple ${entityType} at once`, async function() {
      const addEntity = () => addEntityFn(this.scope);
      const initialEntitiesCount = this.scope.entityModels.length;

      const promise1 = addEntity();
      const promise2 = addEntity();
      expect(promise1).toBe(promise2);

      await promise1;
      await promise2;
      expect(this.scope.entityModels.length).toBe(initialEntitiesCount + 1);

      const promise3 = addEntity();
      expect(promise3).not.toBe(promise1);
    });
  }
});
