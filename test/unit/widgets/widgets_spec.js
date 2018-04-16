describe('widgets', function () {
  beforeEach(function () {
    module('contentful/test');
    this.widgets = this.$inject('widgets');
    this.builtins = this.$inject('widgets/builtin');
  });

  describe('#getAvailable()', function () {
    function testAvailableForFieldType (fieldType) {
      describe(`for field type "${fieldType}"`, function () {
        beforeEach(function () {
          this.available = this.widgets.getAvailable({type: fieldType}, this.builtins);
        });

        it('returns at least one widget', function () {
          expect(this.available.length).toBeGreaterThan(0);
        });

        it('each widget has "id" and "name" property', function () {
          expect(this.available.every(w => w.id && w.name)).toBe(true);
        });

        it('has options property from builtin descriptor', function () {
          this.available.forEach(w => {
            const builtin = _.find(this.builtins, {id: w.id});
            expect(w.options).toEqual(builtin.options);
          });
        });
      });
    }

    testAvailableForFieldType('Text');
    testAvailableForFieldType('Symbol');
    testAvailableForFieldType('Symbols');
    testAvailableForFieldType('Integer');
    testAvailableForFieldType('Number');
    testAvailableForFieldType('Boolean');
    testAvailableForFieldType('Date');
    testAvailableForFieldType('Location');
    testAvailableForFieldType('Asset');
    testAvailableForFieldType('Entry');
    testAvailableForFieldType('Assets');
    testAvailableForFieldType('Entries');
    testAvailableForFieldType('File');
    testAvailableForFieldType('Object');

    it('rejects promise if field type has no widget', function () {
      const available = this.widgets.getAvailable({type: 'unsupportedtype'}, this.builtins);
      expect(available).toEqual([]);
    });
  });

  describe('#filterParams()', function () {
    beforeEach(function () {
      this.descriptor = {options: [{param: 'foo'}]};
    });

    it('removes unknown parameters', function () {
      const params = {unknown: true};
      const filtered = this.widgets.filterParams(this.descriptor, params);
      expect(filtered).toEqual({});
    });

    it('retains known parameters', function () {
      const params = {foo: true, unknown: true};
      const filtered = this.widgets.filterParams(this.descriptor, params);
      expect(filtered).toEqual({foo: true});
    });

    it('removes undefined parameters', function () {
      const params = {foo: undefined};
      const filtered = this.widgets.filterParams(this.descriptor, params);
      expect(filtered).toEqual({});
    });

    it('returns empty object if widget.options is undefined', function () {
      const params = {foo: undefined};
      const filtered = this.widgets.filterParams({}, params);
      expect(filtered).toEqual({});
    });
  });

  describe('#applyDefaults()', function () {
    beforeEach(function () {
      this.descriptor = {
        options: [
          { param: 'x', default: 'DEFAULT' }
        ]
      };
    });

    it('sets missing parameters to default value', function () {
      const params = this.widgets.applyDefaults(this.descriptor, {});
      expect(params.x).toEqual('DEFAULT');
    });

    it('does not overwrite existing params', function () {
      const params = this.widgets.applyDefaults(this.descriptor, {x: 'VALUE'});
      expect(params.x).toEqual('VALUE');
    });
  });

  describe('#filterOptions(widget, params)', function () {
    it('Hides date picker AM/PM option if in date-only mode', function () {
      const datePicker = {
        id: 'datePicker',
        options: [{param: 'format'}, {param: 'ampm'}]
      };

      const t1 = this.widgets.filterOptions(datePicker, {format: 'dateonly'});
      expect(t1.length).toBe(1);
      expect(t1[0].param).toBe('format');

      const t2 = this.widgets.filterOptions(datePicker, {format: 'timeZ'});
      expect(t2.length).toBe(2);
      expect(t2[1].param).toBe('ampm');
    });
  });

  describe('#buildRenderable()', function () {
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
        {id: 'SIDEBAR', fieldTypes: ['Symbol'], sidebar: true}
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
        {id: 'SIDEBAR', fieldTypes: ['Symbol'], template: 'TEMPLATE'}
      ]);
      expect(renderable.form[0].template).toEqual('TEMPLATE');
    });

    it('keeps settings property', function () {
      const params = {param: 'MY PARAMS'};
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'foo', field: {type: 'Symbol'}, settings: params}
      ], [
        {id: 'foo', fieldTypes: ['Symbol']}
      ]);
      expect(renderable.form[0].settings).toEqual(params);
    });

    it('adds default parameters if there are no parameters', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'foo', field: {type: 'Symbol'}}
      ], [
        {id: 'foo', fieldTypes: ['Symbol'], options: [
          {param: 'bar', default: 'lol'},
          {param: 'baz'}
        ]}
      ]);
      expect(renderable.form[0].settings).toEqual({bar: 'lol'});
    });

    it('adds default parameters data does not contain an object', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'foo', field: {type: 'Symbol'}}
      ], [
        {id: 'foo', fieldTypes: ['Symbol'], options: [{param: 'foo', default: 'bar'}]}
      ]);
      expect(renderable.form[0].settings).toEqual({foo: 'bar'});
    });

    it('applies default parameters without overiding existing ones', function () {
      const renderable = this.widgets.buildRenderable([
        {widgetId: 'foo', field: {type: 'Symbol'}, settings: {x: true}}
      ], [
        {id: 'foo', fieldTypes: ['Symbol'], options: [
          {param: 'x', default: 'DEF_X'},
          {param: 'y', default: 'DEF_Y'}
        ]}
      ]);
      expect(renderable.form[0].settings).toEqual({
        x: true,
        y: 'DEF_Y'
      });
    });
  });
});
