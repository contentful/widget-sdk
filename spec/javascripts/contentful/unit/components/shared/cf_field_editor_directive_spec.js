'use strict';

describe('cfFieldEditor Directive', function () {
  var element, scope;
  var compileElement;
  beforeEach(function () {
    module('contentful/test', function($provide) {
      $provide.stubDirective('otPath', {
        controller: angular.noop
      });
    });
    inject(function ($compile, $rootScope, widgets) {
      scope = $rootScope.$new();
      widgets.registerWidget('testType', {template: '<span class="foo">bar</span>' });
      widgets.registerWidget('type2'   , {template: '<span class="bar">foo</span>' });
      scope.entity = {data: {fields: []}};
      scope.widget = {
        widgetId: 'testType',
        field: { id: 'fieldId' }
      };
      scope.getFieldValidationsOfType = sinon.stub();

      compileElement = function () {
        element = $compile('<div ot-path class="cf-field-editor" cf-editor-entity="entity"></div>')(scope);
        scope.$apply();
      };
    });
  });

  it('installs a widget', function() {
    compileElement();
    expect(element.find('.foo').length).toBe(1);
  });

  it('exchanges a widget', function() {
    compileElement();
    expect(element.find('.foo').length).toBe(1);
    scope.widget.widgetId = 'type2';
    scope.$apply();
    expect(element.find('.foo').length).toBe(0);
    expect(element.find('.bar').length).toBe(1);
  });

  it('displays a warning for unknown widgets', function() {
    scope.widget.widgetId = 'lolwut';
    compileElement();
    expect(element.text()).toMatch('Unknown editor widget "lolwut"');
  });

});
