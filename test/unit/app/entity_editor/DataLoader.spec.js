import * as K from 'test/helpers/mocks/kefir';
import _ from 'lodash';

describe('app/entity_editor/DataLoader.es6', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.constant('widgets/WidgetRenderable.es6', {
        buildRenderables: sinon.stub().returns({}),
        buildSidebarRenderables: sinon.stub().returns([])
      });
      $provide.constant('TheLocaleStore', {
        getPrivateLocales: sinon.stub().returns([])
      });
      $provide.constant('data/CMA/ProductCatalog.es6', {
        getOrgFeature: () => Promise.resolve(true)
      });
    });

    const $q = this.$inject('$q');

    // TODO use space context mock
    this.spaceContext = {
      space: {
        getEntry: sinon.spy(id => $q.resolve({ data: makeEntity(id, 'CTID') })),
        getEntries: function(query) {
          const ids = query['sys.id[in]'].split(',');
          const items = ids.map(id => ({ data: makeEntity(id, 'CTID') }));
          return $q.resolve(items);
        },
        getAsset: sinon.spy(id => $q.resolve({ data: makeEntity(id) }))
      },
      publishedCTs: {
        fetch: function(id) {
          return $q.resolve({ data: makeCt(id) });
        }
      },
      editorInterfaceRepo: {
        get: sinon.stub().resolves({})
      },
      docPool: {
        get: sinon.stub()
      },
      organization: {
        sys: { id: 'orgid' }
      }
    };

    this.localeStore = this.$inject('TheLocaleStore');

    const DataLoader = this.$inject('app/entity_editor/DataLoader.es6');
    this.loadEntry = _.partial(DataLoader.loadEntry, this.spaceContext);
    this.loadAsset = _.partial(DataLoader.loadAsset, this.spaceContext);
    this.makePrefetchEntryLoader = _.partial(DataLoader.makePrefetchEntryLoader, this.spaceContext);
  });

  describe('#loadEntry()', () => {
    it('adds entry to context', function*() {
      const editorData = yield this.loadEntry('EID');
      sinon.assert.calledWith(this.spaceContext.space.getEntry, 'EID');
      expect(editorData.entity.data.sys.id).toEqual('EID');
    });

    it('adds the entry’s content type to the context', function*() {
      const editorData = yield this.loadEntry('EID');
      expect(editorData.contentType.data.sys.id).toEqual('CTID');
    });

    it('requests the editor interface', function*() {
      yield this.loadEntry('EID');
      sinon.assert.calledWith(
        this.spaceContext.editorInterfaceRepo.get,
        sinon.match.has('sys', sinon.match.has('id', 'CTID'))
      );
    });

    it('builds field controls from editor interface', function*() {
      const ei = { controls: 'CONTROLS' };
      this.spaceContext.editorInterfaceRepo.get.resolves(ei);
      yield this.loadEntry('EID');
      sinon.assert.calledWith(
        this.$inject('widgets/WidgetRenderable.es6').buildRenderables,
        'CONTROLS',
        sinon.match({ builtin: sinon.match(Array), extension: [] })
      );
    });

    it('adds the entry’s field controls to the context', function*() {
      const controls = {};
      this.$inject('widgets/WidgetRenderable.es6').buildRenderables.returns(controls);
      const editorData = yield this.loadEntry('EID');
      expect(editorData.fieldControls).toBe(controls);
    });

    it('adds entityInfo to the context', function*() {
      const { entityInfo } = yield this.loadEntry('EID');
      expect(entityInfo.id).toBe('EID');
      expect(entityInfo.type).toBe('Entry');
      expect(entityInfo.contentTypeId).toBe('CTID');
      expect(entityInfo.contentType.sys.id).toBe('CTID');
    });

    it('only adds specified properties', function*() {
      const data = yield this.loadEntry('EID');
      expect(Object.keys(data)).toEqual([
        'entity',
        'contentType',
        'fieldControls',
        'sidebar',
        'sidebarExtensions',
        'entityInfo',
        'openDoc'
      ]);
    });

    describe('sanitization', () => {
      beforeEach(function() {
        this.entry = makeEntity('EID', 'CTID');
        this.spaceContext.space.getEntry = sinon.stub().resolves({ data: this.entry });
      });

      it('enforces field object', function*() {
        this.entry.fields = null;
        const editorData = yield this.loadEntry('EID');
        expect(_.isPlainObject(editorData.entity.data.fields)).toBe(true);
      });

      it('removes non object fields', function*() {
        this.entry.fields = null;
        this.entry.fields = { a: null, b: {} };
        const editorData = yield this.loadEntry('EID');
        expect(Object.keys(editorData.entity.data.fields)).toEqual(['b']);
      });

      it('removes unknown locale codes', function*() {
        this.localeStore.getPrivateLocales.returns([
          { internal_code: 'l1' },
          { internal_code: 'l2' }
        ]);
        this.entry.fields = {
          a: {
            l1: true,
            l2: true,
            l3: true
          }
        };
        const editorData = yield this.loadEntry('EID');
        expect(editorData.entity.data.fields.a).toEqual({ l1: true, l2: true });
      });
    });

    it('provides #openDoc() delegate', function*() {
      this.spaceContext.docPool.get.returns('DOC');
      const editorData = yield this.loadEntry('EID');
      const doc = editorData.openDoc();
      expect(doc).toBe('DOC');
      sinon.assert.calledWith(
        this.spaceContext.docPool.get,
        editorData.entity,
        editorData.contentType
      );
    });
  });

  describe('#loadAsset()', () => {
    it('adds asset to context', function*() {
      const editorData = yield this.loadAsset('EID');
      sinon.assert.calledWith(this.spaceContext.space.getAsset, 'EID');
      expect(editorData.entity.data.sys.id).toEqual('EID');
    });

    it('builds field controls from asset editor interface', function*() {
      yield this.loadAsset('EID');
      sinon.assert.calledWith(
        this.$inject('widgets/WidgetRenderable.es6').buildRenderables,
        sinon.match([
          sinon.match({ fieldId: 'title', widgetId: 'singleLine', field: sinon.match.has('id') }),
          sinon.match({
            fieldId: 'description',
            widgetId: 'singleLine',
            field: sinon.match.has('id')
          }),
          sinon.match({ fieldId: 'file', widgetId: 'fileEditor', field: sinon.match.has('id') })
        ])
      );
    });

    it('only adds specified properties', function*() {
      const data = yield this.loadAsset('EID');
      expect(Object.keys(data)).toEqual([
        'entity',
        'contentType',
        'fieldControls',
        'sidebar',
        'sidebarExtensions',
        'entityInfo',
        'openDoc'
      ]);
    });
  });

  describe('#makePrefetchEntryLoader()', () => {
    it('returns editor data', function*() {
      const controls = {};
      this.$inject('widgets/WidgetRenderable.es6').buildRenderables.returns(controls);

      const load = this.makePrefetchEntryLoader(K.constant([]));
      const editorData = yield load('EID');

      expect(editorData.entity.data.sys.id).toEqual('EID');
      expect(editorData.contentType.data.sys.id).toEqual('CTID');
      expect(editorData.fieldControls).toBe(controls);
      expect(editorData.entityInfo.id).toBe('EID');
      expect(editorData.entityInfo.type).toBe('Entry');
      expect(editorData.entityInfo.contentTypeId).toBe('CTID');
      expect(editorData.entityInfo.contentType.sys.id).toBe('CTID');
      expect(typeof editorData.openDoc).toBe('function');
    });
  });

  function makeEntity(id, ctid) {
    const type = ctid ? 'Entry' : 'Asset';
    const ct = ctid && {
      sys: { id: ctid }
    };
    return {
      sys: {
        id: id,
        type: type,
        contentType: ct
      }
    };
  }

  function makeCt(id) {
    return {
      sys: {
        id: id
      }
    };
  }
});
