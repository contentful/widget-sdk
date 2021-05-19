import * as K from '__mocks__/kefirMock';
import _ from 'lodash';

import * as DataLoader from 'app/entity_editor/DataLoader';

import * as WidgetRenderable from 'widgets/WidgetRenderable';
import * as LocaleStore from 'services/localeStore';
import * as ProductCatalog from 'data/CMA/ProductCatalog';
import * as CustomWidgetLoaderInstance from 'widgets/CustomWidgetLoaderInstance';

jest.mock('widgets/WidgetRenderable');
jest.mock('services/localeStore');
jest.mock('widgets/CustomWidgetLoaderInstance');

describe('app/entity_editor/DataLoader', () => {
  let stubs, spaceContext, loadEntry, loadAsset, makePrefetchEntryLoader;
  beforeEach(async function () {
    stubs = {
      buildRenderables: jest.fn().mockReturnValue({}),
    };

    WidgetRenderable.buildRenderables = stubs.buildRenderables;
    WidgetRenderable.buildSidebarRenderables = jest.fn().mockReturnValue([]);
    WidgetRenderable.buildEditorsRenderables = jest.fn().mockReturnValue([]);

    LocaleStore.default.getPrivateLocales = jest.fn().mockReturnValue([]);

    ProductCatalog.getOrgFeature = () => Promise.resolve(true);

    CustomWidgetLoaderInstance.getCustomWidgetLoader = () =>
      Promise.resolve({
        getWithEditorInterface: () => Promise.resolve([]),
      });

    // TODO use space context mock
    spaceContext = {
      getId: () => 'spaceid',
      getEnvironmentId: () => 'envid',
      space: {
        getEntry: jest
          .fn()
          .mockImplementation((id) => Promise.resolve({ data: makeEntity(id, 'CTID') })),
        getEntries: function (query) {
          const ids = query['sys.id[in]'].split(',');
          const items = ids.map((id) => ({ data: makeEntity(id, 'CTID') }));
          return Promise.resolve(items);
        },
        getAsset: jest.fn().mockImplementation((id) => Promise.resolve({ data: makeEntity(id) })),
      },
      publishedCTs: {
        fetch: function (id) {
          return Promise.resolve(makeCt(id));
        },
      },
      cma: {
        getEditorInterface: jest.fn().mockResolvedValue({}),
      },
      docPool: {
        get: jest.fn(),
      },
      organization: {
        sys: { id: 'orgid' },
      },
    };

    loadEntry = _.partial(DataLoader.loadEntry, spaceContext);
    loadAsset = _.partial(DataLoader.loadAsset, spaceContext);
    makePrefetchEntryLoader = _.partial(DataLoader.makePrefetchEntryLoader, spaceContext);
  });

  describe('#loadEntry()', function () {
    it('adds entry to context', async function () {
      const editorData = await loadEntry('EID');
      expect(spaceContext.space.getEntry).toHaveBeenCalledWith('EID');
      expect(editorData.entity.data.sys.id).toEqual('EID');
    });

    it('adds the entry’s content type to the context', async function () {
      const editorData = await loadEntry('EID');
      expect(editorData.contentType.sys.id).toEqual('CTID');
    });

    it('requests the editor interface', async function () {
      await loadEntry('EID');
      expect(spaceContext.cma.getEditorInterface).toHaveBeenCalledWith('CTID');
    });

    it('builds field controls from editor interface', async function () {
      const ei = { controls: [] };
      spaceContext.cma.getEditorInterface.mockResolvedValue(ei);
      await loadEntry('EID');
      expect(stubs.buildRenderables).toHaveBeenCalledWith(
        [],
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('adds the entry’s field controls to the context', async function () {
      const controls = {};
      stubs.buildRenderables.mockReturnValue(controls);
      const editorData = await loadEntry('EID');
      expect(editorData.fieldControls).toBe(controls);
    });

    it('adds entityInfo to the context', async function () {
      const { entityInfo } = await loadEntry('EID');
      expect(entityInfo.id).toBe('EID');
      expect(entityInfo.type).toBe('Entry');
      expect(entityInfo.contentTypeId).toBe('CTID');
      expect(entityInfo.contentType.sys.id).toBe('CTID');
    });

    it('only adds specified properties', async function () {
      const data = await loadEntry('EID');
      expect(Object.keys(data)).toEqual([
        'entity',
        'contentType',
        'entityInfo',
        'openDoc',
        'editorInterface',
        'widgetTrackingContexts',
        'fieldControls',
        'sidebar',
        'sidebarExtensions',
        'editorsExtensions',
        'customEditor',
      ]);
    });

    describe('sanitization', () => {
      let entry;
      beforeEach(function () {
        entry = makeEntity('EID', 'CTID');
        spaceContext.space.getEntry = jest.fn().mockResolvedValue({ data: entry });
      });

      it('enforces field object', async function () {
        entry.fields = null;
        const editorData = await loadEntry('EID');
        expect(_.isPlainObject(editorData.entity.data.fields)).toBe(true);
      });

      it('removes non object fields', async function () {
        entry.fields = null;
        entry.fields = { a: null, b: {} };
        const editorData = await loadEntry('EID');
        expect(Object.keys(editorData.entity.data.fields)).toEqual(['b']);
      });

      it('removes unknown locale codes', async function () {
        LocaleStore.default.getPrivateLocales.mockReturnValue([
          { internal_code: 'l1' },
          { internal_code: 'l2' },
        ]);
        entry.fields = {
          a: {
            l1: true,
            l2: true,
            l3: true,
          },
        };
        const editorData = await loadEntry('EID');
        expect(editorData.entity.data.fields.a).toEqual({ l1: true, l2: true });
      });
    });

    it('provides #openDoc() delegate', async function () {
      spaceContext.docPool.get.mockReturnValue('DOC');
      const editorData = await loadEntry('EID');
      const doc = editorData.openDoc();
      expect(doc).toBe('DOC');
      expect(spaceContext.docPool.get).toHaveBeenCalledWith(
        editorData.entity,
        editorData.contentType,
        undefined
      );
    });
  });

  describe('#loadAsset()', () => {
    it('adds asset to context', async function () {
      const editorData = await loadAsset('EID');
      expect(spaceContext.space.getAsset).toHaveBeenCalledWith('EID');
      expect(editorData.entity.data.sys.id).toEqual('EID');
    });

    it('builds field controls from asset editor interface', async function () {
      await loadAsset('EID');

      const matchArrayItems = (eiField, control) => {
        Object.entries(eiField).forEach(([key, value]) => {
          expect(control[key]).toBe(value);
        });
        expect(control.field).toHaveProperty('id');
      };

      const [controls, widgets] = stubs.buildRenderables.mock.calls[0];
      expect(widgets).toEqual(expect.any(Array));

      [
        {
          fieldId: 'title',
          widgetNamespace: 'builtin',
          widgetId: 'singleLine',
        },
        {
          fieldId: 'description',
          widgetNamespace: 'builtin',
          widgetId: 'multipleLine',
        },
        {
          fieldId: 'file',
          widgetNamespace: 'builtin',
          widgetId: 'fileEditor',
        },
      ].forEach((eiField, index) => matchArrayItems(eiField, controls[index]));
    });

    it('only adds specified properties', async function () {
      const data = await loadAsset('EID');
      expect(Object.keys(data)).toEqual([
        'entity',
        'contentType',
        'entityInfo',
        'openDoc',
        'editorInterface',
        'widgetTrackingContexts',
        'fieldControls',
        'sidebar',
        'sidebarExtensions',
        'editorsExtensions',
        'customEditor',
      ]);
    });
  });

  describe('#makePrefetchEntryLoader()', () => {
    it('mockReturnValue editor data', async function () {
      const controls = {};
      stubs.buildRenderables.mockReturnValue(controls);

      const load = makePrefetchEntryLoader(K.constant([]));
      const editorData = await load('EID');

      expect(editorData.entity.data.sys.id).toEqual('EID');
      expect(editorData.contentType.sys.id).toEqual('CTID');
      expect(editorData.fieldControls).toBe(controls);
      expect(editorData.entityInfo.id).toBe('EID');
      expect(editorData.entityInfo.type).toBe('Entry');
      expect(editorData.entityInfo.contentTypeId).toBe('CTID');
      expect(editorData.entityInfo.contentType.sys.id).toBe('CTID');
      expect(typeof editorData.openDoc).toBe('function');
    });
  });

  function makeEntity(id, ctId) {
    const type = ctId ? 'Entry' : 'Asset';
    const contentType = ctId && makeCt(ctId);
    return {
      sys: {
        id,
        type,
        contentType,
      },
    };
  }

  function makeCt(id) {
    return {
      sys: {
        id,
      },
    };
  }
});
