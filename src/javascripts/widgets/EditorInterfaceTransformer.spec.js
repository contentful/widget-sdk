import { fromAPI, toAPI } from './EditorInterfaceTransformer.es6';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from './WidgetNamespaces.es6';

describe('EditorInterfaceTransformer', () => {
  describe('#fromAPI()', () => {
    it('adds a default control if missing', () => {
      const ct = {
        fields: [{ apiName: 'AAA', type: 'Symbol' }, { apiName: 'MISSING', type: 'Boolean' }]
      };
      const ei = { controls: [{ fieldId: 'AAA' }] };

      const { controls } = fromAPI(ct, ei);

      expect(controls).toEqual([
        {
          fieldId: 'AAA',
          field: ct.fields[0],
          widgetNamespace: NAMESPACE_BUILTIN,
          widgetId: 'singleLine'
        },
        {
          fieldId: 'MISSING',
          field: ct.fields[1],
          widgetNamespace: NAMESPACE_BUILTIN,
          widgetId: 'boolean'
        }
      ]);
    });

    it('removes controls for missing fields', () => {
      const ct = { fields: [{ apiName: 'AAA' }] };
      const ei = { controls: [{ fieldId: 'MISSING' }, { fieldId: 'AAA' }] };

      const { controls } = fromAPI(ct, ei);

      expect(controls).toHaveLength(1);
      expect(controls[0].fieldId).toEqual('AAA');
    });

    it('migrates deprecated widgets', () => {
      const ct = { fields: [{ apiName: 'AAA' }] };
      const ei = { controls: [{ fieldId: 'AAA', widgetId: 'kalturaEditor' }] };

      const { controls } = fromAPI(ct, ei);

      expect(controls).toEqual([
        {
          field: { apiName: 'AAA' },
          fieldId: 'AAA',
          widgetId: 'singleLine',
          widgetNamespace: NAMESPACE_BUILTIN
        }
      ]);
    });

    it('keeps provided namespace', () => {
      const ct = { fields: [{ apiName: 'test' }] };
      const ei = { controls: [{ fieldId: 'test', widgetId: 'foo', widgetNamespace: 'bar' }] };

      const { controls } = fromAPI(ct, ei);
      expect(controls[0].widgetNamespace).toEqual('bar');
    });

    it('provides a valid namespace for extensions', () => {
      const ct = { fields: [{ apiName: 'test' }] };
      const ei = { controls: [{ fieldId: 'test', widgetId: 'foo' }] };
      const widgets = {
        extension: [{ id: 'foo' }],
        builtin: [{ id: 'foo' }]
      };

      const { controls } = fromAPI(ct, ei, widgets);

      expect(controls[0].widgetNamespace).toEqual(NAMESPACE_EXTENSION);
    });

    it('provides a valid namespace for builtin widgets', () => {
      const ct = { fields: [{ apiName: 'test' }] };
      const ei = { controls: [{ fieldId: 'test', widgetId: 'foo' }] };
      const widgets = { extension: [], builtin: [{ id: 'foo' }] };

      const { controls } = fromAPI(ct, ei, widgets);

      expect(controls[0].widgetNamespace).toEqual(NAMESPACE_BUILTIN);
    });

    it('restores field order', function() {
      const ct = { fields: [{ apiName: 'one' }, { apiName: 'two' }] };
      const ei = { controls: [{ fieldId: 'two' }, { fieldId: 'one' }] };

      const { controls } = fromAPI(ct, ei);

      expect(controls.map(c => c.fieldId)).toEqual(['one', 'two']);
    });

    it('keeps the sys property', () => {
      const ct = { fields: [] };
      const ei = { sys: { type: 'EditorInterface', id: 'eid' }, controls: [] };

      const { sys } = fromAPI(ct, ei);

      expect(sys).toEqual({ type: 'EditorInterface', id: 'eid' });
    });

    describe('field mapping', () => {
      it('prefers the apiName over the field ID', () => {
        const ct = {
          fields: [{ id: 'id2', apiName: 'apiName' }, { id: 'apiName', apiName: 'field2' }]
        };

        const ei = { controls: [{ widgetId: 'W', fieldId: 'apiName' }] };

        const { controls } = fromAPI(ct, ei);

        expect(controls.map(c => c.fieldId)).toEqual(['apiName', 'field2']);
        expect(controls[0].widgetId).toEqual('W');
      });

      it('falls back to the field ID', () => {
        const ct = {
          fields: [{ id: 'id1' }, { id: 'id2', apiName: 'apiName2' }]
        };

        const ei = {
          controls: [{ widgetId: 'A', fieldId: 'id1' }, { widgetId: 'B', fieldId: 'apiName2' }]
        };

        const { controls } = fromAPI(ct, ei);

        expect(controls.map(c => c.fieldId)).toEqual(['id1', 'apiName2']);
        expect(controls.map(c => c.widgetId)).toEqual(['A', 'B']);
      });
    });
  });

  describe('#toAPI()', () => {
    it('strips unknown properties', () => {
      const control = {
        fieldId: 'test',
        widgetId: 'helloWorld',
        widgetNamespace: 'test',
        settings: { test: true },
        field: { id: 'test' },
        unknown: 'test',
        oneMore: 666
      };

      const ct = { fields: [{ apiName: 'test' }] };
      const ei = { controls: [control] };

      const { controls } = toAPI(ct, ei);

      expect(controls).toEqual([
        {
          fieldId: 'test',
          widgetId: 'helloWorld',
          widgetNamespace: 'test',
          settings: { test: true }
        }
      ]);
    });

    it('removes empty settings', () => {
      const control = {
        fieldId: 'test',
        widgetId: 'helloWorld',
        widgetNamespace: 'test',
        settings: {}
      };
      const ct = { fields: [{ apiName: 'test' }] };
      const ei = { controls: [control] };

      const { controls } = toAPI(ct, ei);

      expect(controls).toEqual([
        { fieldId: 'test', widgetId: 'helloWorld', widgetNamespace: 'test' }
      ]);
    });

    it('restores field order', function() {
      const ct = { fields: [{ apiName: 'one' }, { apiName: 'two' }] };
      const ei = { controls: [{ fieldId: 'two' }, { fieldId: 'one' }] };

      const { controls } = toAPI(ct, ei);

      expect(controls.map(c => c.fieldId)).toEqual(['one', 'two']);
    });

    it('keeps the sys property', () => {
      const ct = { fields: [] };
      const ei = { sys: { type: 'EditorInterface', id: 'eid' }, controls: [] };

      const { sys } = toAPI(ct, ei);

      expect(sys).toEqual({ type: 'EditorInterface', id: 'eid' });
    });
  });
});
