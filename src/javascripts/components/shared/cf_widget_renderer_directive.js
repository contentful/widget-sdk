'use strict';

//
// Obtain the widget template and render it. Provides `scope.field` for
// form widgets.
//

angular.module('contentful').directive('cfWidgetRenderer', ['$injector', function($injector) {
  var $compile = $injector.get('$compile');
  var widgets  = $injector.get('widgets');

  return {
    restrict: 'E',
    link: function (scope, element) {
      var widgetScope;
      scope.$on('$destroy', destroyWidget);

      scope.$watch('widget.widgetId', installWidget);

      scope.field = scope.widget && scope.widget.field;
      scope.$watch('widget.field', function (field) {
        scope.field = field;
      });

      function installWidget(widgetId) {
        if (widgetScope) {
          destroyWidget();
        }
        if (widgetId) {
          var template = widgets.widgetTemplate(widgetId);
          widgetScope = scope.$new();
          var $widget = $(template);
          element.append($widget);
          $compile($widget)(widgetScope);
        }
      }

      function destroyWidget() {
        widgetScope.$destroy();
        widgetScope = null;
        element.empty();
      }
    }
  };
}]);
