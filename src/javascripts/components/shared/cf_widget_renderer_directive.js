'use strict';

/**
 * Render the widget template in the element. Provides `scope.field` for
 * form widgets.
 */
angular.module('contentful').directive('cfWidgetRenderer', ['$injector', function($injector) {
  var $compile = $injector.get('$compile');

  return {
    restrict: 'E',
    link: function (scope, element) {
      var widgetManager = createWidgetManager(scope, element);
      scope.$on('$destroy', widgetManager.destroy);
      scope.$watch('widget.template', widgetManager.install);
    }
  };

  /**
   * Return an object that renders widget templates in the element.
   *
   * The `install` method on the object takes a template string and
   * renders it on `element` with a new child scope.
   *
   * The `destroy` method deletes the child scope and clears the
   * element.
   */
  function createWidgetManager(parentScope, element) {
    var scope = null;
    return {
      install: install,
      destroy: destroy,
    };

    function install(template) {
      destroy();

      if (!template)
        return;

      scope = parentScope.$new();
      var $widget = $(template);
      element.append($widget);
      $compile($widget)(scope);
    }

    function destroy() {
      if (scope)
        scope.$destroy();
      scope = null;
      element.empty();
    }

  }
}]);
