'use strict';

angular.module('contentful/directives').directive('cfFieldEditor', function(widgets, $compile) {
  return {
    restrict: 'C',
    require: '^otPath',
    link: function(scope, elm, attr) {
      scope.$on('otValueChanged', function (event, path, value) {
        if (path === event.currentScope.otPath) event.currentScope.value = value;
      });

      scope.$on('otTextIdle', function (event) {
        event.currentScope.otUpdateEntity();
      });

      var widget = widgets.editor(scope.field.type, attr.editor);
      elm.html(widget.template);
      $compile(elm.contents())(scope);
      if(typeof widget.link === 'function') widget.link(scope, elm, attr);
    }
  };
});
