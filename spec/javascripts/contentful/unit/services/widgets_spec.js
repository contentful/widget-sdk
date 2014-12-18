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
  
  
  

});
