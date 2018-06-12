describe('widgets', () => {
  beforeEach(function () {
    module('contentful/test');
    this.widgets = this.$inject('widgets');
  });

  describe('#buildRenderable()', () => {
    it('returns object with widget arrays', function () {
      const renderable = this.widgets.buildRenderable([], []);
      expect(renderable.form).toEqual([]);
      expect(renderable.sidebar).toEqual([]);
    });

    it('filters widgets without field', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'HAS_FIELD', field: {}},
        {widgetId: 'NO_FIELD'}
      ], []);
      expect(renderable.form.length).toBe(1);
      expect(renderable.form[0].widgetId).toBe('HAS_FIELD');
    });

    it('adds sidebar widges to sidebar collection', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'SIDEBAR', field: {type: 'Symbol'}}
      ], [
        {id: 'SIDEBAR', fieldTypes: ['Symbol'], sidebar: true, parameters: []}
      ]);
      expect(renderable.form.length).toBe(0);
      expect(renderable.sidebar.length).toBe(1);
      expect(renderable.sidebar[0].widgetId).toBe('SIDEBAR');
    });

    it('sets warning template if widget does not exist', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'foo', field: {type: 'Symbol'}}
      ], []);
      expect(renderable.form[0].template)
      .toMatch('The editor widget “foo” does not exist');
    });

    it('sets warning template if widget is incompatible', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'foo', field: {type: 'Symbol'}}
      ], [
        {id: 'foo', fieldTypes: ['Boolean']}
      ]);
      expect(renderable.form[0].template)
      .toMatch('The “foo” editor widget cannot be used with this field');
    });

    it('adds widget’s template property', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'SIDEBAR', field: {type: 'Symbol'}}
      ], [
        {id: 'SIDEBAR', fieldTypes: ['Symbol'], template: 'TEMPLATE', parameters: []}
      ]);
      expect(renderable.form[0].template).toEqual('TEMPLATE');
    });

    it('keeps settings property', function () {
      const params = {param: 'MY PARAMS'};
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'foo', field: {type: 'Symbol'}, settings: params}
      ], [
        {id: 'foo', fieldTypes: ['Symbol'], parameters: [{id: 'param'}]}
      ]);
      expect(renderable.form[0].settings).toEqual(params);
    });

    it('adds default parameters if there are no parameters', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'foo', field: {type: 'Symbol'}}
      ], [
        {id: 'foo', fieldTypes: ['Symbol'], parameters: [
          {id: 'bar', default: 'lol'},
          {id: 'baz'}
        ]}
      ]);
      expect(renderable.form[0].settings).toEqual({bar: 'lol'});
    });

    it('adds default parameters data does not contain an object', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'foo', field: {type: 'Symbol'}}
      ], [
        {id: 'foo', fieldTypes: ['Symbol'], parameters: [{id: 'foo', default: 'bar'}]}
      ]);
      expect(renderable.form[0].settings).toEqual({foo: 'bar'});
    });

    it('applies default parameters without overiding existing ones', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'foo', field: {type: 'Symbol'}, settings: {x: true}}
      ], [
        {id: 'foo', fieldTypes: ['Symbol'], parameters: [
          {id: 'x', default: 'DEF_X'},
          {id: 'y', default: 'DEF_Y'}
        ]}
      ]);
      expect(renderable.form[0].settings).toEqual({
        x: true,
        y: 'DEF_Y'
      });
    });

    it('forwards installation parameters', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'foo', field: {type: 'Symbol'}, settings: {x: true}}
      ], [
        {
          id: 'foo',
          fieldTypes: ['Symbol'],
          parameters: [{id: 'x'}],
          installationParameters: {
            definitions: [{id: 'y', default: 'test'}, {id: 'z'}],
            values: {z: true}
          }
        }
      ]);
      expect(renderable.form[0].settings).toEqual({x: true});
      expect(renderable.form[0].installationParameterValues).toEqual({z: true, y: 'test'});
    });
  });
});
