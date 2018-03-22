import * as sinon from 'helpers/sinon';

describe('widgets', function () {
  let widgets;

  beforeEach(function () {
    module('contentful/test');

    const Store = this.$inject('widgets/store');
    this.storeGetMap = sinon.stub();
    Store.create = _.constant({getMap: this.storeGetMap});

    this.setupWidgets = function (ws) {
      const builtinWidgets = this.$inject('widgets/builtin');

      this.storeGetMap.resolves(ws || builtinWidgets);

      widgets = this.$inject('widgets');
      widgets.setSpace();
      this.$apply();
    };
  });

  afterEach(function () {
    widgets = null;
  });

  describe('#setSpace()', function () {
    beforeEach(function () {
      this.storeGetMap.resolves();
      widgets = this.$inject('widgets');
    });

    it('calls WidgetStore.getMap()', function () {
      widgets.setSpace({});
      sinon.assert.calledWithExactly(this.storeGetMap);
    });

    pit('returns the service when the store has fetched the widgets', function () {
      return widgets.setSpace()
      .then(function (widgets_) {
        expect(widgets).toBe(widgets_);
      });
    });
  });

  describe('#getAvailable()', function () {
    beforeEach(function () {
      this.setupWidgets();
    });

    it('calls store.getMap()', function () {
      this.storeGetMap.resetHistory();
      widgets.getAvailable('number');
      sinon.assert.calledOnce(this.storeGetMap);
    });


    function testAvailableForFieldType (fieldType) {
      describe('for field type "' + fieldType + '"', function () {
        let availableWidgets;
        beforeEach(function () {
          widgets.getAvailable({type: fieldType}).then(function (_widgets) {
            availableWidgets = _widgets;
          });
          this.$apply();
        });

        it('returns at least one widget', function () {
          expect(availableWidgets.length).toBeGreaterThan(0);
        });

        it('each widget has "id" and "name" property', function () {
          expect(_.every(availableWidgets, function (widget) {
            return widget.id && widget.name;
          })).toBe(true);
        });

        it('has options property from builtin descriptor', function () {
          const builtins = this.$inject('widgets/builtin');
          availableWidgets.forEach(function (widget) {
            const builtin = builtins[widget.id];
            expect(builtin.options).toEqual(widget.options);
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
      let err;
      widgets.getAvailable({type: 'unsupportedtype'}).catch(function (_err) {
        err = _err;
      });
      this.$apply();
      expect(err).not.toBeUndefined();
    });
  });

  describe('#filteredParams()', function () {
    beforeEach(function () {
      this.setupWidgets({
        'WID': {
          options: [{param: 'foo'}]
        }
      });
    });

    it('removes unknown parameters', function () {
      const params = {unknown: true};
      const filtered = widgets.filteredParams('WID', params);
      expect(filtered).toEqual({});
    });

    it('retains known parameters', function () {
      const params = {foo: true, unknown: true};
      const filtered = widgets.filteredParams('WID', params);
      expect(filtered).toEqual({foo: true});
    });

    it('removes undefined parameters', function () {
      const params = {foo: undefined};
      const filtered = widgets.filteredParams('WID', params);
      expect(filtered).toEqual({});
    });

    it('returns empty object if widget.options is undefined', function () {
      this.setupWidgets({
        'WID': {}
      });
      const params = {foo: undefined};
      const filtered = widgets.filteredParams('WID', params);
      expect(filtered).toEqual({});
    });
  });

  describe('#applyDefaults()', function () {
    beforeEach(function () {
      this.setupWidgets({
        'WIDGET': {
          options: [
            { param: 'x', default: 'DEFAULT' }
          ]
        }
      });
      this.widgets = this.$inject('widgets');
    });

    it('sets missing parameters to default value', function () {
      const params = {};
      this.widgets.applyDefaults('WIDGET', params);
      expect(params.x).toEqual('DEFAULT');
    });

    it('does not overwrite existing params', function () {
      const params = {x: 'VALUE'};
      this.widgets.applyDefaults('WIDGET', params);
      expect(params.x).toEqual('VALUE');
    });
  });

  describe('#filterOptions(widget, params)', function () {
    it('Hides date picker AM/PM option if in date-only mode', function () {
      const datePicker = {
        id: 'datePicker',
        options: [{param: 'format'}, {param: 'ampm'}]
      };
      this.setupWidgets({datePicker});

      const t1 = widgets.filterOptions(datePicker, {format: 'dateonly'});
      expect(t1.length).toBe(1);
      expect(t1[0].param).toBe('format');

      const t2 = widgets.filterOptions(datePicker, {format: 'timeZ'});
      expect(t2.length).toBe(2);
      expect(t2[1].param).toBe('ampm');
    });
  });

  describe('#buildRenderable()', function () {
    let descriptor, field;

    beforeEach(function () {
      descriptor = { fieldTypes: ['Symbol'] };
      field = { type: 'Symbol' };

      this.setupWidgets({
        'WIDGET': descriptor
      });

      this.buildOne = function (widget) {
        return widgets.buildRenderable([_.defaults(widget || {}, {
          widgetId: 'WIDGET',
          field: field
        })]);
      };
    });

    it('returns object with widget arrays', function () {
      const renderable = widgets.buildRenderable([]);
      expect(renderable.form).toEqual([]);
      expect(renderable.sidebar).toEqual([]);
    });

    it('filters widgets without field', function () {
      const renderable = widgets.buildRenderable([
        {widgetId: 'HAS_FIELD', field: {}},
        {widgetId: 'NO_FIELD'}
      ]);
      expect(renderable.form.length).toBe(1);
      expect(renderable.form[0].widgetId).toBe('HAS_FIELD');
    });

    it('adds sidebar widges to sidebar collection', function () {
      descriptor.sidebar = true;
      const renderable = this.buildOne();
      expect(renderable.form.length).toBe(0);
      expect(renderable.sidebar.length).toBe(1);
      expect(renderable.sidebar[0].widgetId).toBe('WIDGET');
    });

    it('adds widget’s template property', function () {
      descriptor.template = 'TEMPLATE';
      const renderable = this.buildOne();
      expect(renderable.form[0].template).toEqual('TEMPLATE');
    });

    it('sets warning template if widget does not exist', function () {
      const renderable = this.buildOne({widgetId: 'foo'});
      expect(renderable.form[0].template)
      .toMatch('The editor widget “foo” does not exist');
    });

    it('sets warning template if widget is incompatible', function () {
      field.type = 'other type';
      const renderable = this.buildOne();
      expect(renderable.form[0].template)
      .toMatch('The “WIDGET” editor widget cannot be used with this field');
    });

    it('keeps settings property', function () {
      const params = {param: 'MY PARAMS'};
      const renderable = this.buildOne({settings: params});
      expect(renderable.form[0].settings).toEqual(params);
    });

    it('adds default parameters if there are no parameters', function () {
      descriptor.options = [
        {param: 'foo', default: 'bar'}
      ];
      const renderable = this.buildOne();
      expect(renderable.form[0].settings).toEqual({foo: 'bar'});
    });

    it('adds default parameters data does not contain an object', function () {
      descriptor.options = [
        {param: 'foo', default: 'bar'}
      ];
      const renderable = this.buildOne({ settings: 'not an object' });
      expect(renderable.form[0].settings).toEqual({foo: 'bar'});
    });

    it('applies default parameters without overiding existing ones', function () {
      descriptor.options = [
        {param: 'x', default: 'DEF_X'},
        {param: 'y', default: 'DEF_Y'}
      ];
      const renderable = this.buildOne({settings: {x: true}});
      expect(renderable.form[0].settings).toEqual({
        x: true,
        y: 'DEF_Y'
      });
    });
  });
});
