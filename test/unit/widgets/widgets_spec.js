'use strict';

describe('Widget types service', function () {
  var widgets;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      function mockWidgetStore() {
        function WidgetStore(space) {
          this.space = space;
        }
        WidgetStore.prototype.getMap = sinon.stub();
        return WidgetStore;
      }

      $provide.factory('widgets/store', mockWidgetStore);
    });

    this.setupWidgets = function(ws) {
      var builtinWidgets = this.$inject('widgets/builtin');

      var WidgetStore = this.$inject('widgets/store');
      WidgetStore.prototype.getMap.resolves(ws || builtinWidgets);

      widgets = this.$inject('widgets');
      widgets.setSpace();
      this.$apply();
    };

  });

  describe('#setSpace()', function () {

    beforeEach(function () {
      var WidgetStore = this.$inject('widgets/store');
      WidgetStore.prototype.getMap.resolves();
      widgets = this.$inject('widgets');
    });

    it('calls WidgetStore.getMap()', function () {
      var WidgetStore = this.$inject('widgets/store');
      var space = {};
      widgets.setSpace(space);
      sinon.assert.calledWithExactly(WidgetStore.prototype.getMap);
    });

    pit('returns the service when the store has fetched the widgets', function () {
      return widgets.setSpace()
      .then(function (widgets_) {
        expect(widgets).toBe(widgets_);
      });
    });
  });

  describe('#getAvailable()', function(){
    beforeEach(function () {
      // Disable checking if a widget is misconfigured since this
      // involves API requests.
      var widgetChecks = this.$inject('widgets/checks');
      widgetChecks.markMisconfigured = function (widgets) {
        return widgets;
      };

      this.setupWidgets();
    });

    it('calls store.getMap()', function() {
      var WidgetStore = this.$inject('widgets/store');
      var getMap = WidgetStore.prototype.getMap;
      sinon.assert.calledOnce(getMap);
      widgets.getAvailable('number');
      sinon.assert.calledTwice(getMap);
    });


    function testAvailableForFieldType (fieldType) {
      describe('for field type "' + fieldType + '"', function() {
        var availableWidgets;
        beforeEach(function() {
          widgets.getAvailable({type: fieldType}).then(function (_widgets) {
            availableWidgets = _widgets;
          });
          this.$apply();
        });

        it('returns at least one widget', function() {
          expect(availableWidgets.length).toBeGreaterThan(0);
        });

        it('each widget has "id" and "name" property', function() {
          expect(_.every(availableWidgets, function (widget) {
            return widget.id && widget.name;
          })).toBe(true);
        });

        it('has options property from builtin descriptor', function() {
          var builtins = this.$inject('widgets/builtin');
          availableWidgets.forEach(function (widget) {
            var builtin = builtins[widget.id];
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

    it('rejects promise if field type has no widget', function() {
      var err;
      widgets.getAvailable({type: 'unsupportedtype'}).catch(function (_err) {
        err = _err;
      });
      this.$apply();
      expect(err).not.toBeUndefined();
    });
  });

  describe('#defaultWidgetId()', function() {
    var contentType, field;

    beforeEach(function() {
      contentType = {
        data: {},
        getId: sinon.stub()
      };
      field = {};
      this.setupWidgets();
    });

    it('with an unexistent field', function() {
      field.type = 'unsupportedtype';
      expect(widgets.defaultWidgetId(field, contentType)).toBeUndefined();
    });

    describe('if validations exist but are different', function() {
      beforeEach(function() {
        field.validations = [{'size': {max: 500, min: 0}}];
      });

      it('for a type with a dropdown widget', function() {
        field.type = 'Symbol';
        expect(widgets.defaultWidgetId(field, contentType)).toBe('singleLine');
      });

      it('for a type with no dropdown widget', function() {
        field.type = 'Date';
        expect(widgets.defaultWidgetId(field, contentType)).toBe('datePicker');
      });
    });

    describe('if validations exist', function() {
      beforeEach(function() {
        field.validations = [{'in': ['123']}];
      });

      it('for a type with a dropdown widget', function() {
        field.type = 'Symbol';
        expect(widgets.defaultWidgetId(field, contentType)).toBe('dropdown');
      });

      it('for a type with no dropdown widget', function() {
        field.type = 'Date';
        expect(widgets.defaultWidgetId(field, contentType)).toBe('datePicker');
      });
    });

    describe('if field is Text', function() {
      beforeEach(function() {
        field.type = 'Text';
        field.id = 'textfield';
      });

      it('and is display field', function() {
        contentType.data.displayField = 'textfield';
        expect(widgets.defaultWidgetId(field, contentType)).toBe('singleLine');
      });

      it('is not a display field', function() {
        expect(widgets.defaultWidgetId(field, contentType)).toBe('markdown');
      });
    });

    it('if field is Entry', function() {
      field.type = 'Link';
      field.linkType = 'Entry';
      expect(widgets.defaultWidgetId(field, contentType)).toBe('entryLinkEditor');
    });

    it('if field is Asset', function() {
      field.type = 'Link';
      field.linkType = 'Asset';
      expect(widgets.defaultWidgetId(field, contentType)).toBe('assetLinkEditor');
    });

    it('if field is a list of Assets', function() {
      field.type = 'Array';
      field.items = {type: 'Link', linkType: 'Asset'};
      expect(widgets.defaultWidgetId(field, contentType)).toBe('assetLinksEditor');
    });

    it('if field is a list of Entries', function() {
      field.type = 'Array';
      field.items = {type: 'Link', linkType: 'Entry'};
      expect(widgets.defaultWidgetId(field, contentType)).toBe('entryLinksEditor');
    });

    it('returns builtin widget id for each type', function () {
      var fieldFactory = this.$inject('fieldFactory');
      var builtins = this.$inject('widgets/builtin');

      _.forEach(fieldFactory.types, function (typeDescriptor) {
        var field = fieldFactory.createTypeInfo(typeDescriptor);
        var widgetId = widgets.defaultWidgetId(field, contentType);
        expect(widgetId in builtins).toBe(true);

        if (typeDescriptor.hasListVariant) {
          field = fieldFactory.createTypeInfo(typeDescriptor, true);
          widgetId = widgets.defaultWidgetId(field, contentType);
          expect(widgetId in builtins).toBe(true);
        }
      });
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
      var params = {unknown: true};
      var filtered = widgets.filteredParams('WID', params);
      expect(filtered).toEqual({});
    });

    it('retains known parameters', function () {
      var params = {foo: true, unknown: true};
      var filtered = widgets.filteredParams('WID', params);
      expect(filtered).toEqual({foo: true});
    });

    it('removes undefined parameters', function () {
      var params = {foo: undefined};
      var filtered = widgets.filteredParams('WID', params);
      expect(filtered).toEqual({});
    });

    it('returns empty object if widget.options is undefined', function () {
      this.setupWidgets({
        'WID': {}
      });
      var params = {foo: undefined};
      var filtered = widgets.filteredParams('WID', params);
      expect(filtered).toEqual({});
    });
  });

  describe('paramDefaults', function(){
    it('should contain the defaults for every param', function() {
      this.setupWidgets({'herp': {
        options: [
          {param: 'foo', default: 123 },
          {param: 'bar', default: 'derp'},
          {param: 'baz'}
        ]
      }});

      var d = widgets.paramDefaults('herp');
      expect(d.foo).toBe(123);
      expect(d.bar).toBe('derp');
      expect(d.baz).toBe(undefined);
    });

    it('should be an empty object for unknown widgets', function(){
      expect(widgets.paramDefaults('lolnope')).toEqual({});
    });
  });

  describe('#applyDefaults(widget)', function () {
    beforeEach(function () {
      this.widgets = this.$inject('widgets');
      this.options = [{
        param: 'x',
        default: 'DEFAULT'
      }];
    });

    it('sets missing parameters to default value', function () {
      var params = {};
      this.widgets.applyDefaults(params, this.options);
      expect(params.x).toEqual('DEFAULT');
    });

    it('does not overwrite existing params', function () {
      var params = {x: 'VALUE'};
      this.widgets.applyDefaults(params, this.options);
      expect(params.x).toEqual('VALUE');
    });
  });

  describe('#filterOptions(opts, params)', function() {
    var filtered, options;

    beforeEach(function() {
      options = [
        {param: 'x', default: 0},
        {param: 'y', default: 0}
      ];
      this.setupWidgets({
        test: {options: options}
      });
    });

    function feedTest(pairs) {
      pairs.forEach(function(pair) {
        var params = _.isObject(pair[0]) ? pair[0] : {x: pair[0]};
        filtered = widgets.filterOptions(options, params);
        expect(filtered.length).toEqual(pair[1]);
      });
    }

    it('returns all options when no dependencies specified', function() {
      feedTest([[1,2]]);
    });

    it('removes option if no dependencies are met (one acceptable value)', function() {
      options[1].dependsOnAny = {x: 'test'};
      feedTest([[2,1], [null, 1], ['test', 2]]);
    });

    it('removes option if no dependencies are met (multiple acceptable values)', function() {
      options[1].dependsOnAny = {x: [1, 3, 8]};
      feedTest([[2,1], ['test',1], [null, 1], [1,2], [3,2], [8,2]]);
    });

    it('removes option if no dependencies are met (depending on multiple params)', function() {
      var deps = {};
      options.push({param: 'z', default: 0, dependsOnAny: deps});
      deps.x = [1000, 'test'];
      deps.y = 'hello';

      feedTest([
        [{x: 1000,   y: 'foo'  }, 3],
        [{x: 'test', y: 'foo'  }, 3],
        [{x: 'bar',  y: 'hello'}, 3],
        [{x: 1000,   y: 'hello'}, 3],
        [{x: 'test', y: 'hello'}, 3],
        [{x: -1,     y: -1     }, 2],
        [{x: null,   y: -1     }, 2],
        [{x: -1,     y: null   }, 2],
        [{x: null,   y: null   }, 2]
      ]);
    });

    it('removes option if some of dependencies are not met', function() {
      var deps = {};
      options.push({param: 'z', default: 0, dependsOnEvery: deps});
      deps.x = 42;
      deps.y = 'hello';

      feedTest([
        [{x: 42,   y: 'hello'}, 3],
        [{x: 42,   y: 'hi!'  }, 2],
        [{x: -1,   y: 'hello'}, 2],
        [{x: null, y: -1     }, 2]
      ]);
    });
  });

  describe('#buildRenderable()', function () {

    beforeEach(function() {
      this.setupWidgets();
    });

    it('has widget’s template property', function () {
      var renderable = widgets.buildRenderable({widgetId: 'singleLine'});
      var template = widgets.get('singleLine').template;
      expect(renderable.template).toEqual(template);
    });

    it('keeps widgetParams property', function () {
      var params = 'MY PARAMS';
      var widget = {widgetId: 'singleLine', widgetParams: params};
      var renderable = widgets.buildRenderable(widget);
      expect(renderable.widgetParams).toBe(params);
    });

    it('sets "sidebar" property', function () {
      this.setupWidgets({
        'WIDGET': {sidebar: true}
      });
      var renderable = widgets.buildRenderable({widgetId: 'WIDGET'});
      expect(renderable.sidebar).toBe(true);
    });

    it('sets fallback template if widget does not exist', function () {
      var renderable = widgets.buildRenderable({widgetId: 'does not exist'});
      expect(renderable.template).toMatch('Unknown editor widget "does not exist"');
    });

  });

  describe('#buildSidebarWidgets()', function () {
    var apiWidgets, fields;

    beforeEach(function () {
      apiWidgets = [{fieldId: 'FIELD', widgetId: 'WIDGET'}];
      fields = [{id: 'FIELD'}];
      this.setupWidgets({
        'WIDGET': {sidebar: true, template: 'TEMPLATE'}
      });
    });

    it('adds field data to the widget', function () {
      var renderable = widgets.buildSidebarWidgets(apiWidgets, fields);
      expect(renderable[0].field).toBe(fields[0]);
    });

    it('adds descriptor data to the widget', function () {
      var renderable = widgets.buildSidebarWidgets(apiWidgets, fields);
      expect(renderable[0].sidebar).toEqual(true);
      expect(renderable[0].template).toEqual('TEMPLATE');
    });

    it('filters non-sidebar widgets', function () {
      var widgetDescriptor = {sidebar: true};
      this.setupWidgets({ 'WIDGET': widgetDescriptor });

      var renderable = widgets.buildSidebarWidgets(apiWidgets, fields);
      expect(renderable.length).toEqual(1);

      widgetDescriptor.sidebar = false;
      renderable = widgets.buildSidebarWidgets(apiWidgets, fields);
      expect(renderable.length).toEqual(0);
    });

    it('filters widgets without fields', function () {
      var renderable = widgets.buildSidebarWidgets(apiWidgets, fields);
      expect(renderable.length).toEqual(1);

      renderable = widgets.buildSidebarWidgets(apiWidgets, [{id: 'OTHER'}]);
      expect(renderable.length).toEqual(0);
    });
  });
});
