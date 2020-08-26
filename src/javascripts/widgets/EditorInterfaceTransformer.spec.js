import { fromAPI, toAPI } from './EditorInterfaceTransformer';
import { WidgetNamespace } from '@contentful/widget-renderer';

jest.mock('./BuiltinWidgets', () => ({ create: jest.fn(() => []) }));

describe('EditorInterfaceTransformer', () => {
  describe('#fromAPI()', () => {
    it('adds a default control if missing', () => {
      const ct = {
        sys: { id: 'CT' },
        fields: [
          { apiName: 'AAA', type: 'Symbol' },
          { apiName: 'MISSING', type: 'Boolean' },
        ],
      };
      const ei = { controls: [{ fieldId: 'AAA' }] };

      const { controls } = fromAPI(ct, ei);

      expect(controls).toEqual([
        {
          fieldId: 'AAA',
          field: ct.fields[0],
          widgetNamespace: WidgetNamespace.BUILTIN,
          widgetId: 'singleLine',
        },
        {
          fieldId: 'MISSING',
          field: ct.fields[1],
          widgetNamespace: WidgetNamespace.BUILTIN,
          widgetId: 'boolean',
        },
      ]);
    });

    it('removes controls for missing fields', () => {
      const ct = { sys: { id: 'CT' }, fields: [{ apiName: 'AAA' }] };
      const ei = { controls: [{ fieldId: 'MISSING' }, { fieldId: 'AAA' }] };

      const { controls } = fromAPI(ct, ei);

      expect(controls).toHaveLength(1);
      expect(controls[0].fieldId).toEqual('AAA');
    });

    it('migrates deprecated widgets', () => {
      const ct = { sys: { id: 'CT' }, fields: [{ apiName: 'AAA' }] };
      const ei = { controls: [{ fieldId: 'AAA', widgetId: 'kalturaEditor' }] };

      const { controls } = fromAPI(ct, ei);

      expect(controls).toEqual([
        {
          field: { apiName: 'AAA' },
          fieldId: 'AAA',
          widgetId: 'singleLine',
          widgetNamespace: WidgetNamespace.BUILTIN,
        },
      ]);
    });

    it('resets the control if provided an invalid namespace', () => {
      const ct = { sys: { id: 'CT' }, fields: [{ apiName: 'test', type: 'Symbol' }] };
      const ei = { controls: [{ fieldId: 'test', widgetId: 'foo', widgetNamespace: 'bar' }] };

      const { controls } = fromAPI(ct, ei);
      expect(controls[0].widgetNamespace).toEqual(WidgetNamespace.BUILTIN);
      expect(controls[0].widgetId).toEqual('singleLine');
    });

    it('provides the builtin namespace if missing', () => {
      const ct = { sys: { id: 'CT' }, fields: [{ apiName: 'test' }] };
      const ei = { controls: [{ fieldId: 'test', widgetId: 'foo' }] };

      const BuiltinWidgets = jest.requireMock('./BuiltinWidgets');
      BuiltinWidgets.create.mockReturnValue([{ id: 'foo' }]);

      const { controls } = fromAPI(ct, ei);

      expect(controls[0].widgetNamespace).toEqual(WidgetNamespace.BUILTIN);
      expect(controls[0].widgetId).toEqual('foo');
    });

    it('provides the extension namespace if missing', () => {
      const ct = { sys: { id: 'CT' }, fields: [{ apiName: 'test' }] };
      const ei = { controls: [{ fieldId: 'test', widgetId: 'foo' }] };

      const BuiltinWidgets = jest.requireMock('./BuiltinWidgets');
      BuiltinWidgets.create.mockReturnValue([{ id: 'bar' }]);

      const { controls } = fromAPI(ct, ei);

      expect(controls[0].widgetNamespace).toEqual(WidgetNamespace.EXTENSION);
      expect(controls[0].widgetId).toEqual('foo');
    });

    it('restores field order', function () {
      const ct = { sys: { id: 'CT' }, fields: [{ apiName: 'one' }, { apiName: 'two' }] };
      const ei = { controls: [{ fieldId: 'two' }, { fieldId: 'one' }] };

      const { controls } = fromAPI(ct, ei);

      expect(controls.map((c) => c.fieldId)).toEqual(['one', 'two']);
    });

    it('keeps existing sys properties and provides type and CT link', () => {
      const ct = { sys: { id: 'CT' }, fields: [] };
      const ei = { sys: { updatedAt: 'some-time' }, controls: [] };

      const { sys } = fromAPI(ct, ei);

      expect(sys).toEqual({
        updatedAt: 'some-time',
        type: 'EditorInterface',
        contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'CT' } },
      });
    });

    it('convert old editor to editors', () => {
      const ct = {
        sys: { id: 'CT' },
      };
      const ei = { editor: { settings: {}, widgetId: 'app-id', widgetNamespace: 'app' } };
      const { editors } = fromAPI(ct, ei);

      expect(editors).toEqual([
        { settings: {}, widgetId: 'app-id', widgetNamespace: 'app' },
        { widgetId: 'default-editor', widgetNamespace: 'editor-builtin', disabled: true },
        { widgetId: 'reference-tree', widgetNamespace: 'editor-builtin', disabled: true },
      ]);
    });

    it('use default editors in case no editors are present', () => {
      const ct = {
        sys: { id: 'CT' },
      };
      const ei = { editors: [] };
      const { editors } = fromAPI(ct, ei);

      expect(editors).toEqual([
        { widgetId: 'default-editor', widgetNamespace: 'editor-builtin', disabled: false },
        { widgetId: 'reference-tree', widgetNamespace: 'editor-builtin', disabled: false },
      ]);
    });

    it('doesnt do anything in case editors list isnt empty', () => {
      const ct = {
        sys: { id: 'CT' },
      };
      const ei = { editors: [{ settings: {}, widgetId: 'app-id', widgetNamespace: 'app' }] };
      const { editors } = fromAPI(ct, ei);

      expect(editors).toEqual([{ settings: {}, widgetId: 'app-id', widgetNamespace: 'app' }]);
    });

    describe('field mapping', () => {
      it('prefers the apiName over the field ID', () => {
        const ct = {
          sys: { id: 'CT' },
          fields: [
            { id: 'id2', apiName: 'apiName' },
            { id: 'apiName', apiName: 'field2' },
          ],
        };

        const ei = { controls: [{ widgetId: 'W', fieldId: 'apiName' }] };

        const { controls } = fromAPI(ct, ei);

        expect(controls.map((c) => c.fieldId)).toEqual(['apiName', 'field2']);
        expect(controls[0].widgetId).toEqual('W');
      });

      it('falls back to the field ID', () => {
        const ct = {
          sys: { id: 'CT' },
          fields: [{ id: 'id1' }, { id: 'id2', apiName: 'apiName2' }],
        };

        const ei = {
          controls: [
            { widgetId: 'A', fieldId: 'id1' },
            { widgetId: 'B', fieldId: 'apiName2' },
          ],
        };

        const { controls } = fromAPI(ct, ei);

        expect(controls.map((c) => c.fieldId)).toEqual(['id1', 'apiName2']);
        expect(controls.map((c) => c.widgetId)).toEqual(['A', 'B']);
      });
    });
  });

  describe('#toAPI()', () => {
    it('strips unknown properties', () => {
      const control = {
        fieldId: 'test',
        widgetId: 'helloWorld',
        widgetNamespace: WidgetNamespace.BUILTIN,
        settings: { test: true },
        field: { id: 'test' },
        unknown: 'test',
        oneMore: 666,
      };

      const ct = { sys: { id: 'CT' }, fields: [{ apiName: 'test' }] };
      const ei = { controls: [control] };

      const { controls } = toAPI(ct, ei);

      expect(controls).toEqual([
        {
          fieldId: 'test',
          widgetId: 'helloWorld',
          widgetNamespace: WidgetNamespace.BUILTIN,
          settings: { test: true },
        },
      ]);
    });

    it('removes empty settings', () => {
      const control = {
        fieldId: 'test',
        widgetId: 'helloWorld',
        widgetNamespace: WidgetNamespace.BUILTIN,
        settings: {},
      };
      const ct = { sys: { id: 'CT' }, fields: [{ apiName: 'test' }] };
      const ei = { controls: [control] };

      const { controls } = toAPI(ct, ei);

      expect(controls).toEqual([
        { fieldId: 'test', widgetId: 'helloWorld', widgetNamespace: WidgetNamespace.BUILTIN },
      ]);
    });

    it('restores field order', function () {
      const ct = { sys: { id: 'CT' }, fields: [{ apiName: 'one' }, { apiName: 'two' }] };
      const ei = { controls: [{ fieldId: 'two' }, { fieldId: 'one' }] };

      const { controls } = toAPI(ct, ei);

      expect(controls.map((c) => c.fieldId)).toEqual(['one', 'two']);
    });

    it('keeps existing sys properties and provides type and CT link', () => {
      const ct = { sys: { id: 'CT' }, fields: [] };
      const ei = { sys: { updatedAt: 'some-time' }, controls: [] };

      const { sys } = toAPI(ct, ei);

      expect(sys).toEqual({
        updatedAt: 'some-time',
        type: 'EditorInterface',
        contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'CT' } },
      });
    });

    it('convert old editor to editors', () => {
      const ct = {
        sys: { id: 'CT' },
      };
      const ei = { editor: { settings: {}, widgetId: 'app-id', widgetNamespace: 'app' } };
      const { editors } = toAPI(ct, ei);

      expect(editors).toEqual([
        { settings: {}, widgetId: 'app-id', widgetNamespace: 'app' },
        { widgetId: 'default-editor', widgetNamespace: 'editor-builtin', disabled: true },
        { widgetId: 'reference-tree', widgetNamespace: 'editor-builtin', disabled: true },
      ]);
    });

    it('never sends enabled default editors', () => {
      const ct = {
        sys: { id: 'CT' },
      };
      const ei = {
        editors: [
          { settings: {}, widgetId: 'app-id', widgetNamespace: 'app' },
          { widgetId: 'default-editor', widgetNamespace: 'editor-builtin', disabled: false },
        ],
      };
      const { editors } = toAPI(ct, ei);

      expect(editors).toEqual([{ settings: {}, widgetId: 'app-id', widgetNamespace: 'app' }]);
    });
  });
});
