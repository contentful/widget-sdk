'use strict';

describe('cfWidgetRenderer Directive', function () {
  var scope;
  var compileWidgetElement;
  beforeEach(function () {
    module('contentful/test');
    inject(function ($compile, $rootScope, widgets) {
      widgets.registerWidget('foo', {template: '<span class="foo">bar</span>' });
      widgets.registerWidget('bar', {template: '<span class="bar">foo</span>' });

      scope = $rootScope.$new();
      scope.widget = {};

      compileWidgetElement = function () {
        var element = $compile('<cf-widget-renderer></cf-widget-renderer>')(scope);
        scope.$apply();
        return element;
      };
    });
  });

  it('renders widget', function() {
    scope.widget.template = '<p class=foo>';
    var el = compileWidgetElement();
    expect(el.find('.foo').length).toBe(1);
  });

  it('exchanges a rendered widget', function() {
    scope.widget.template = '<p class=foo>';
    var el = compileWidgetElement();
    expect(el.find('.foo').length).toBe(1);

    scope.widget.template = '<p class=bar>';
    scope.$apply();

    expect(el.find('.foo').length).toBe(0);
    expect(el.find('.bar').length).toBe(1);
  });

  it('sets field', function() {
    var widgetField = {};
    scope.widget.field = widgetField;
    compileWidgetElement();
    expect(scope.field).toEqual(widgetField);
  });

  it('updates field', function() {
    compileWidgetElement();
    var newField = {};
    scope.widget.field = newField;
    scope.$apply();
    expect(scope.field).toEqual(newField);
  });

});
