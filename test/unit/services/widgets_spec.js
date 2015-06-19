'use strict';

describe('Widget types service', function () {
  var widgets, $rootScope;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($injector) {
      widgets = $injector.get('widgets');
      $rootScope = $injector.get('$rootScope');
    });
  });

  describe('forField', function(){
    function testTypesFor(fieldType) {
      describe('gets widget types for a field with type '+fieldType, function() {
        var types;
        beforeEach(function() {
          widgets.forField({type: fieldType}).then(function (_types) {
            types = _types;
          });
          $rootScope.$apply();
        });

        it('gets types list', function() {
          expect(types.length).not.toBeUndefined();
        });

        it('types have ids', function() {
          expect(_.every(types, function (item) {
            return item.id && item.name;
          })).toBeTruthy();
        });
      });
    }

    testTypesFor('Text');
    testTypesFor('Symbol');
    testTypesFor('Symbols');
    testTypesFor('Integer');
    testTypesFor('Number');
    testTypesFor('Boolean');
    testTypesFor('Date');
    testTypesFor('Location');
    testTypesFor('Asset');
    testTypesFor('Entry');
    testTypesFor('Assets');
    testTypesFor('Entries');
    testTypesFor('File');
    testTypesFor('Object');

    it('fails to get widget for an unknown type', function() {
      var err;
      widgets.forField({type: 'unsupportedtype'}).catch(function (_err) {
        err = _err;
      });
      $rootScope.$apply();
      expect(err).not.toBeUndefined();
    });
  });

  describe('defaultWidgetId', function() {
    var contentType, field, idStub;

    beforeEach(function() {
      idStub = sinon.stub();
      contentType = {
        data: {},
        getId: idStub
      };

      field = {};
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

      it('and is asset', function() {
        idStub.returns('asset');
        expect(widgets.defaultWidgetId(field, contentType)).toBe('singleLine');
      });

      it('is no display field or asset', function() {
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

    it('if field is File', function() {
      field.type = 'File';
      expect(widgets.defaultWidgetId(field, contentType)).toBe('fileEditor');
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
  });

  describe('optionsForWidget', function(){
    it('should return empty array for missing widget', function () {
      expect(widgets.optionsForWidget('foobar')).toEqual([]);
      expect(widgets.optionsForWidget(null)).toEqual([]);
    });
    it('should contain common options', function () {
      var options = widgets.optionsForWidget('singleLine', 'field');
      expect(_.find(options, {param: 'helpText'})).toBeTruthy();
    });
    it('should contain field widget options', function () {
      var options = widgets.optionsForWidget('rating', 'field');
      expect(_.find(options, {param: 'stars'})).toBeTruthy();
    });
    it('should contain static widget options', function () {
      var options = widgets.optionsForWidget('infoText', 'static');
      expect(_.find(options, {param: 'text'})).toBeTruthy();
    });
  });

  describe('paramDefaults', function(){
    it('should contain the defaults for every param', function() {
      widgets.registerWidget('herp', {
        options: [
          {param: 'foo', default: 123 },
          {param: 'bar', default: 'derp'},
          {param: 'baz'}
        ]
      });

      var d = widgets.paramDefaults('herp', 'field');
      expect(d.foo).toBe(123);
      expect(d.bar).toBe('derp');
      expect(d.baz).toBe(undefined);
    });

    it('should be an empty object for unknown widgets', function(){
      expect(widgets.paramDefaults('lolnope')).toEqual({});
    });
  });

  describe('registerWidget', function(){
    it('adds a widget to the database so that it can be retrieved', function () {
      widgets.registerWidget('foo', {fieldTypes: ['Text']});
      widgets.forField({type: 'Text'}).then(function(widgets) {
        expect(_.any(widgets, {id: 'foo'})).toBe(true);
      });
      $rootScope.$apply();
    });
    it('does not overwrite widgets', function () {
      widgets.registerWidget('foo', {fieldTypes: ['Text']});
      widgets.registerWidget('foo', {fieldTypes: ['Number']});
      widgets.forField({type: 'Number'}).then(function(widgets) {
        expect(_.any(widgets, {id: 'foo'})).toBe(false);
      });
      $rootScope.$apply();
    });
  });

  describe('widgetTemplate', function(){
    it('returns the template property for a widget', function () {
      widgets.registerWidget('foo', {fieldTypes: ['Text'], template: 'bar'});
      expect(widgets.widgetTemplate('foo')).toBe('bar');
    });
    it('returns a warning for a missing widget', function () {
      expect(widgets.widgetTemplate('derp')).toBe('<div class="missing-widget-template">Unknown editor widget "derp"</div>');
    });
  });

  describe('#applyDefaults(widget)', function () {
    beforeEach(function () {
      this.widgets = this.$inject('widgets');
      this.widgets.registerWidget('test', {
        options: [{
          param: 'x',
          default: 'DEFAULT'
        }]
      });
    });

    it('sets missing parameters to default value', function () {
      var widget = {widgetId: 'test'};
      this.widgets.applyDefaults(widget);
      expect(widget.widgetParams['x']).toEqual('DEFAULT');
    });

    it('does not overwrite existing params', function () {
      var widget = {
        widgetId: 'test',
        widgetParams: {x: 'VALUE'}
      };
      this.widgets.applyDefaults(widget);
      expect(widget.widgetParams['x']).toEqual('VALUE');
    });
  });

  describe('#filterOptions(opts, params)', function() {
    var widgets, filtered, descriptor;

    beforeEach(function() {
      widgets = this.$inject('widgets');
      descriptor = {options: [{param: 'x', default: 0}, {param: 'y', default: 0}]};
      widgets.registerWidget('test', descriptor);
    });

    function feedTest(pairs) {
      var options = widgets.optionsForWidget('test', 'field');
      pairs.forEach(function(pair) {
        var params = _.isObject(pair[0]) ? pair[0] : {x: pair[0]};
        filtered = widgets.filterOptions(options, params);
        filtered.shift(); // remove help text
        expect(filtered.length).toEqual(pair[1]);
      });
    }

    it('returns all options when no dependencies specified', function() {
      feedTest([[1,2]]);
    });

    it('removes option if no dependencies are met (one acceptable value)', function() {
      descriptor.options[1].dependsOnAny = {x: 'test'};
      feedTest([[2,1], [null, 1], ['test', 2]]);
    });

    it('removes option if no dependencies are met (multiple acceptable values)', function() {
      descriptor.options[1].dependsOnAny = {x: [1, 3, 8]};
      feedTest([[2,1], ['test',1], [null, 1], [1,2], [3,2], [8,2]]);
    });

    it('removes option if no dependencies are met (depending on multiple params)', function() {
      var deps = {};
      descriptor.options.push({param: 'z', default: 0, dependsOnAny: deps});
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
      descriptor.options.push({param: 'z', default: 0, dependsOnEvery: deps});
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

});
