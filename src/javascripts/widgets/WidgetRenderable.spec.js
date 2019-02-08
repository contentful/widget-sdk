import buildRenderables from './WidgetRenderable.es6';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from './WidgetNamespaces.es6';

describe('WidgetRenderables', () => {
  describe('#buildRenderables()', () => {
    it('returns object with widget arrays', () => {
      const renderables = buildRenderables([], {});
      expect(renderables.form).toEqual([]);
      expect(renderables.sidebar).toEqual([]);
    });

    it('filters widgets without field', () => {
      const renderables = buildRenderables(
        [{ widgetId: 'HAS_FIELD', field: {} }, { widgetId: 'NO_FIELD' }],
        {}
      );
      expect(renderables.form).toHaveLength(1);
      expect(renderables.form[0].widgetId).toBe('HAS_FIELD');
    });

    it('adds sidebar widges to sidebar collection', () => {
      const renderables = buildRenderables(
        [{ widgetId: 'SIDEBAR', widgetNamespace: NAMESPACE_EXTENSION, field: { type: 'Symbol' } }],
        {
          extension: [{ id: 'SIDEBAR', fieldTypes: ['Symbol'], sidebar: true, parameters: [] }]
        }
      );
      expect(renderables.form).toHaveLength(0);
      expect(renderables.sidebar).toHaveLength(1);
      expect(renderables.sidebar[0].widgetId).toBe('SIDEBAR');
    });

    it('sets problem warning flag if widget does not exist', () => {
      const renderables = buildRenderables(
        [{ widgetId: 'foo', widgetNamespace: 'bar', field: { type: 'Symbol' } }],
        {}
      );
      expect(renderables.form[0].problem).toBe('missing');
    });

    it('sets problem warning flag if widget is incompatible', () => {
      const renderables = buildRenderables(
        [{ widgetId: 'foo', widgetNamespace: NAMESPACE_BUILTIN, field: { type: 'Symbol' } }],
        {
          builtin: [{ id: 'foo', fieldTypes: ['Boolean'] }]
        }
      );
      expect(renderables.form[0].problem).toBe('incompatible');
    });

    it('adds widget’s template property', () => {
      const renderables = buildRenderables(
        [{ widgetId: 'SIDEBAR', widgetNamespace: NAMESPACE_EXTENSION, field: { type: 'Symbol' } }],
        {
          extension: [
            { id: 'SIDEBAR', fieldTypes: ['Symbol'], template: 'TEMPLATE', parameters: [] }
          ]
        }
      );
      expect(renderables.form[0].template).toEqual('TEMPLATE');
    });

    it('keeps settings property', () => {
      const params = { param: 'MY PARAMS' };
      const renderables = buildRenderables(
        [
          {
            widgetId: 'foo',
            widgetNamespace: NAMESPACE_EXTENSION,
            field: { type: 'Symbol' },
            settings: params
          }
        ],
        { extension: [{ id: 'foo', fieldTypes: ['Symbol'], parameters: [{ id: 'param' }] }] }
      );
      expect(renderables.form[0].settings).toEqual(params);
    });

    it('adds default parameters if there are no parameters', () => {
      const renderables = buildRenderables(
        [{ widgetId: 'foo', widgetNamespace: NAMESPACE_EXTENSION, field: { type: 'Symbol' } }],
        {
          extension: [
            {
              id: 'foo',
              fieldTypes: ['Symbol'],
              parameters: [{ id: 'bar', default: 'lol' }, { id: 'baz' }]
            }
          ]
        }
      );
      expect(renderables.form[0].settings).toEqual({ bar: 'lol' });
    });

    it('adds default parameters data does not contain an object', () => {
      const renderables = buildRenderables(
        [{ widgetId: 'foo', widgetNamespace: NAMESPACE_EXTENSION, field: { type: 'Symbol' } }],
        {
          extension: [
            { id: 'foo', fieldTypes: ['Symbol'], parameters: [{ id: 'foo', default: 'bar' }] }
          ]
        }
      );
      expect(renderables.form[0].settings).toEqual({ foo: 'bar' });
    });

    it('applies default parameters without overiding existing ones', () => {
      const renderables = buildRenderables(
        [
          {
            widgetId: 'foo',
            widgetNamespace: NAMESPACE_EXTENSION,
            field: { type: 'Symbol' },
            settings: { x: true }
          }
        ],
        {
          extension: [
            {
              id: 'foo',
              fieldTypes: ['Symbol'],
              parameters: [{ id: 'x', default: 'DEF_X' }, { id: 'y', default: 'DEF_Y' }]
            }
          ]
        }
      );
      expect(renderables.form[0].settings).toEqual({
        x: true,
        y: 'DEF_Y'
      });
    });

    it('forwards installation parameters', () => {
      const renderables = buildRenderables(
        [
          {
            widgetId: 'foo',
            widgetNamespace: NAMESPACE_EXTENSION,
            field: { type: 'Symbol' },
            settings: { x: true }
          }
        ],
        {
          extension: [
            {
              id: 'foo',
              fieldTypes: ['Symbol'],
              parameters: [{ id: 'x' }],
              installationParameters: {
                definitions: [{ id: 'y', default: 'test' }, { id: 'z' }],
                values: { z: true }
              }
            }
          ]
        }
      );
      expect(renderables.form[0].settings).toEqual({ x: true });
      expect(renderables.form[0].installationParameterValues).toEqual({ z: true, y: 'test' });
    });
  });

  it('looks up the widget in the right namespace', () => {
    const renderables = buildRenderables(
      [{ widgetId: 'foo', widgetNamespace: 'bar', field: { type: 'Boolean' } }],
      {
        bar: [{ id: 'foo', fieldTypes: 'Boolean', template: 'FOO-FROM-BAR' }],
        baz: [{ id: 'foo' }]
      }
    );

    expect(renderables.form[0].template).toBe('FOO-FROM-BAR');
  });
});
