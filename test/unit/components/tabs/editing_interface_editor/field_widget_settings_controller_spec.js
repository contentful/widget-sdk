'use strict';
describe('FieldWidgetSettingsController', function(){
  var scope, controller, $q, stubs, createController, optionsForWidget;

  beforeEach(function() {
    module('contentful/test', function($provide) {
      stubs = $provide.makeStubs(['forField', 'optionsForWidget']);
      $provide.value('widgets', {
        registerWidget: sinon.stub(),
        forField: stubs.forField,
        optionsForWidget: stubs.optionsForWidget
      });
    });
    inject(function($rootScope, $controller, _$q_) {
      $q = _$q_;
      scope = $rootScope.$new();
      scope.getFieldForWidget = sinon.stub();
      scope.widget = {};

      createController = function () {
        controller = $controller('FieldWidgetSettingsController', {$scope: scope});
        scope.$apply();
      };
    });
  });

  describe('for a field widget', function() {
    var widgetsForType, optionsForWidget2;
    beforeEach(function() {
      scope.widget.widgetId = 'widget1';
      scope.widget.widgetType = 'field';
      widgetsForType = ['type1', 'type2'];
      stubs.forField.returns($q.when(widgetsForType));
      optionsForWidget = {option: 'forwidget'};
      optionsForWidget2 = {option: 'forwidget2'};
      stubs.optionsForWidget.withArgs('widget1', 'field').returns(optionsForWidget);
      stubs.optionsForWidget.withArgs('widget2', 'field').returns(optionsForWidget2);
      createController();
    });

    it('initializes field', function() {
      sinon.assert.called(scope.getFieldForWidget);
    });

    it('initializes widgets for type', function() {
      expect(scope.widgetsForType).toEqual(widgetsForType);
    });

    it('gets widget options', function() {
      expect(scope.widgetOptions).toEqual(optionsForWidget);
    });

    it('gets widget options for a new widget', function() {
      scope.widget.widgetId = 'widget2';
      scope.$digest();
      expect(scope.widgetOptions).toEqual(optionsForWidget2);
    });

  });

  describe('for a static widget', function() {
    beforeEach(function() {
      scope.widget.widgetType = 'static';
      optionsForWidget = {option: 'forwidget'};
      stubs.optionsForWidget.returns(optionsForWidget);
      createController();
    });

    it('gets widget options', function() {
      expect(scope.widgetOptions).toEqual(optionsForWidget);
    });
  });

});

