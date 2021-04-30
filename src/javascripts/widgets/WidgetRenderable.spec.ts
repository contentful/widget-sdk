import { buildRenderables, buildEditorsRenderables, Control } from './WidgetRenderable';
import { cloneDeep } from 'lodash';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { BuiltinWidget, FieldEditorParameters } from './BuiltinWidgets';

const makeControl = (widgetId: string, field: any, rest?: Partial<Control>): Control => {
  return {
    widgetId,
    field,
    ...rest,
  } as Control;
};

describe('WidgetRenderables', () => {
  describe('#buildRenderables()', () => {
    it('returns object with widget arrays', () => {
      const renderables = buildRenderables([], []);
      expect(renderables.form).toEqual([]);
      expect(renderables.sidebar).toEqual([]);
    });

    it('filters widgets without field', () => {
      const renderables = buildRenderables(
        [makeControl('HAS_FIELD', {}), makeControl('NO_FIELD', undefined)],
        []
      );
      expect(renderables.form).toHaveLength(1);
      expect(renderables.form[0].widgetId).toBe('HAS_FIELD');
    });

    it('adds sidebar widges to sidebar collection', () => {
      const renderables = buildRenderables(
        [
          makeControl(
            'SIDEBAR',
            { type: 'Symbol' },
            { widgetNamespace: WidgetNamespace.EXTENSION }
          ),
        ],
        [
          {
            id: 'SIDEBAR',
            namespace: WidgetNamespace.EXTENSION,
            fieldTypes: ['Symbol'],
            sidebar: true,
            name: 'test',
            parameters: [],
          },
        ]
      );
      expect(renderables.form).toHaveLength(0);
      expect(renderables.sidebar).toHaveLength(1);
      expect(renderables.sidebar[0].widgetId).toBe('SIDEBAR');
    });

    it('sets problem warning flag if widget does not exist', () => {
      const renderables = buildRenderables(
        [makeControl('foo', { type: 'Symbol' }, { widgetNamespace: 'bar' as WidgetNamespace })],
        []
      );
      expect(renderables.form[0].problem).toBe('missing');
    });

    it('sets problem warning flag if widget is incompatible', () => {
      const renderables = buildRenderables(
        [makeControl('foo', { type: 'Symbol' }, { widgetNamespace: WidgetNamespace.BUILTIN })],
        [
          {
            id: 'foo',
            namespace: WidgetNamespace.BUILTIN,
            fieldTypes: ['Boolean'],
          } as BuiltinWidget,
        ]
      );
      expect(renderables.form[0].problem).toBe('incompatible');
    });

    it('keeps settings property', () => {
      const params = { param: 'MY PARAMS' };
      const renderables = buildRenderables(
        [
          makeControl(
            'foo',
            { type: 'Symbol' },
            {
              fieldId: 'bar',
              widgetNamespace: WidgetNamespace.EXTENSION,
              settings: params,
            }
          ),
        ],
        [
          {
            id: 'foo',
            name: 'bar',
            namespace: WidgetNamespace.EXTENSION,
            fieldTypes: ['Symbol'],
            parameters: [{ id: 'param' }],
          },
        ]
      );
      expect(renderables.form[0].settings).toEqual(params);
    });

    it('adds default parameters if there are no parameters', () => {
      const renderables = buildRenderables(
        [
          makeControl(
            'foo',
            { type: 'Symbol' },
            { widgetId: 'foo', fieldId: 'bar', widgetNamespace: WidgetNamespace.EXTENSION }
          ),
        ],
        [
          {
            id: 'foo',
            name: 'bar',
            namespace: WidgetNamespace.EXTENSION,
            fieldTypes: ['Symbol'],
            parameters: [{ id: 'bar', default: 'lol' }, { id: 'baz' }],
          },
        ]
      );
      expect(renderables.form[0].settings).toEqual({ bar: 'lol' });
    });

    it('adds default parameters data does not contain an object', () => {
      const renderables = buildRenderables(
        [
          makeControl(
            'foo',
            { type: 'Symbol' },
            { widgetId: 'foo', fieldId: 'bar', widgetNamespace: WidgetNamespace.EXTENSION }
          ),
        ],
        [
          {
            id: 'foo',
            name: 'bar',
            namespace: WidgetNamespace.EXTENSION,
            fieldTypes: ['Symbol'],
            parameters: [{ id: 'foo', default: 'bar' }],
          },
        ]
      );
      expect(renderables.form[0].settings).toEqual({ foo: 'bar' });
    });

    it('applies default parameters without overiding existing ones', () => {
      const renderables = buildRenderables(
        [
          makeControl(
            'foo',
            { type: 'Symbol' },
            {
              widgetId: 'foo',
              fieldId: 'bar',
              widgetNamespace: WidgetNamespace.EXTENSION,
              settings: { x: true },
            }
          ),
        ],
        [
          {
            id: 'foo',
            name: 'bar',
            namespace: WidgetNamespace.EXTENSION,
            fieldTypes: ['Symbol'],
            parameters: [
              { id: 'x', default: 'DEF_X' },
              { id: 'y', default: 'DEF_Y' },
            ],
          },
        ]
      );
      expect(renderables.form[0].settings).toEqual({
        x: true,
        y: 'DEF_Y',
      });
    });

    it('forwards installation parameters', () => {
      const renderables = buildRenderables(
        [
          makeControl(
            'foo',
            { type: 'Symbol' },
            {
              widgetId: 'foo',
              fieldId: 'bar',
              widgetNamespace: WidgetNamespace.EXTENSION,
              settings: { x: true },
            }
          ),
        ],
        [
          {
            id: 'foo',
            name: 'bar',
            namespace: WidgetNamespace.EXTENSION,
            fieldTypes: ['Symbol'],
            parameters: [{ id: 'x' }],
            installationParameters: {
              definitions: [{ id: 'y', default: 'test' }, { id: 'z' }],
              values: { z: true },
            },
          },
        ]
      );
      expect(renderables.form[0].settings).toEqual({ x: true });
      expect(renderables.form[0].parameters.instance).toEqual({ x: true });
      expect(renderables.form[0].parameters.installation).toEqual({ z: true, y: 'test' });
    });
  });

  it('looks up the widget in the right namespace', () => {
    const renderables = buildRenderables(
      [
        makeControl(
          'foo',
          { type: 'Boolean' },
          { widgetId: 'foo', fieldId: 'bar', widgetNamespace: WidgetNamespace.EXTENSION }
        ),
      ],
      [
        {
          id: 'foo',
          name: 'bar',
          namespace: WidgetNamespace.EXTENSION,
          fieldTypes: ['Boolean'],
          renderFieldEditor: () => 'FOO-FROM-EXT',
        },
        { id: 'foo', namespace: WidgetNamespace.BUILTIN } as BuiltinWidget,
      ]
    );

    const renderFunc = renderables.form[0].renderFieldEditor;

    expect(renderFunc && renderFunc({} as FieldEditorParameters)).toBe('FOO-FROM-EXT');
  });

  describe('#buildEditorsRenderables', () => {
    it('includes non-disabled default editors', () => {
      const editorsRenderables = buildEditorsRenderables(
        [{ settings: {}, widgetId: '72XtXyOy2cTtAH0ByYV8Qb', widgetNamespace: 'extension' }],
        [
          {
            srcdoc: '<h1>Enter here:</h1>\n<input />\n',
            id: '72XtXyOy2cTtAH0ByYV8Qb',
            namespace: 'extension',
            name: 'Buggy Extension',
            fieldTypes: [],
            sidebar: false,
            parameters: [],
            installationParameters: { definitions: [], values: {} },
          },
          { namespace: 'editor-builtin', name: 'Editor', id: 'default-editor' },
          { namespace: 'editor-builtin', name: 'References', id: 'reference-tree' },
        ]
      ).map(cloneDeep);

      expect(editorsRenderables).toEqual([
        {
          widgetId: '72XtXyOy2cTtAH0ByYV8Qb',
          widgetNamespace: 'extension',
          disabled: false,
          parameters: { installation: {}, instance: {} },
          descriptor: {
            srcdoc: '<h1>Enter here:</h1>\n<input />\n',
            id: '72XtXyOy2cTtAH0ByYV8Qb',
            namespace: 'extension',
            name: 'Buggy Extension',
            fieldTypes: [],
            sidebar: false,
            parameters: [],
            installationParameters: { definitions: [], values: {} },
          },
        },
        {
          widgetNamespace: 'editor-builtin',
          descriptor: { name: 'Editor', id: 'default-editor', namespace: 'editor-builtin' },
          widgetId: 'default-editor',
          disabled: false,
          parameters: { installation: {}, instance: {} },
        },
        {
          widgetNamespace: 'editor-builtin',
          descriptor: { name: 'References', id: 'reference-tree', namespace: 'editor-builtin' },
          widgetId: 'reference-tree',
          disabled: false,
          parameters: { installation: {}, instance: {} },
        },
      ]);
    });

    it('uses built default editors when editors list is empty', () => {
      const editorsRenderables = buildEditorsRenderables(
        [],
        [
          { namespace: 'editor-builtin', name: 'Editor', id: 'default-editor' },
          { namespace: 'editor-builtin', name: 'References', id: 'reference-tree' },
        ]
      ).map(cloneDeep);

      expect(editorsRenderables).toEqual([
        {
          widgetNamespace: 'editor-builtin',
          widgetId: 'default-editor',
          disabled: false,
          parameters: { installation: {}, instance: {} },
          descriptor: { name: 'Editor', id: 'default-editor', namespace: 'editor-builtin' },
        },
        {
          widgetNamespace: 'editor-builtin',
          widgetId: 'reference-tree',
          disabled: false,
          parameters: { installation: {}, instance: {} },
          descriptor: { name: 'References', id: 'reference-tree', namespace: 'editor-builtin' },
        },
      ]);
    });

    it('marks disabled editors accordingly', () => {
      const editorsRenderables = buildEditorsRenderables(
        [
          { settings: {}, widgetId: '72XtXyOy2cTtAH0ByYV8Qb', widgetNamespace: 'extension' },
          {
            settings: {},
            widgetId: 'default-editor',
            widgetNamespace: 'editor-builtin',
            disabled: true,
          },
        ],
        [
          {
            srcdoc: '<h1>Enter here:</h1>\n<input />\n',
            id: '72XtXyOy2cTtAH0ByYV8Qb',
            namespace: 'extension',
            name: 'Buggy Extension',
            fieldTypes: [],
            sidebar: false,
            parameters: [],
            installationParameters: { definitions: [], values: {} },
          },
          { namespace: 'editor-builtin', name: 'Editor', id: 'default-editor' },
          { namespace: 'editor-builtin', name: 'References', id: 'reference-tree' },
        ]
      ).map(cloneDeep);

      expect(editorsRenderables).toEqual([
        {
          widgetId: '72XtXyOy2cTtAH0ByYV8Qb',
          widgetNamespace: 'extension',
          disabled: false,
          parameters: { installation: {}, instance: {} },
          descriptor: {
            srcdoc: '<h1>Enter here:</h1>\n<input />\n',
            id: '72XtXyOy2cTtAH0ByYV8Qb',
            namespace: 'extension',
            name: 'Buggy Extension',
            fieldTypes: [],
            sidebar: false,
            parameters: [],
            installationParameters: { definitions: [], values: {} },
          },
        },
        {
          widgetNamespace: 'editor-builtin',
          widgetId: 'default-editor',
          disabled: true,
          parameters: { installation: {}, instance: {} },
          descriptor: { name: 'Editor', id: 'default-editor', namespace: 'editor-builtin' },
        },
        {
          widgetNamespace: 'editor-builtin',
          widgetId: 'reference-tree',
          disabled: false,
          parameters: { installation: {}, instance: {} },
          descriptor: { name: 'References', id: 'reference-tree', namespace: 'editor-builtin' },
        },
      ]);
    });
  });
});
