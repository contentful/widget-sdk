'use strict';

angular.module('contentful/directives').directive('cfFieldEditor', function(widgets, $compile) {
  return {
    restrict: 'C',
    require: '^otPath',
    link: function(scope, elm, attr) {
      scope.$on('otTextIdle', function (event) {
        event.currentScope.otUpdateEntity();
      });

      // Write back local value changes to the entity
      // Necessary because the widgets can't access the entry directly, only the value variable
      scope.$watch('value', function (value, old, scope) {
        if (value === old) return;
        if (!scope.entry.data.fields) {
          scope.entry.data.fields = {};
        }
        if (!scope.entry.data.fields[scope.field.id]) {
          scope.entry.data.fields[scope.field.id] = {};
        }
        scope.entry.data.fields[scope.field.id][scope.locale.code] = value;
      });

      var widget = widgets.editor(scope.field.type, attr.editor);
      elm.html(widget.template);
      $compile(elm.contents())(scope);
      if(typeof widget.link === 'function') widget.link(scope, elm, attr);
    }
  };
});
