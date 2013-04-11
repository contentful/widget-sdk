'use strict';

angular.module('contentful/directives').directive('cfFieldEditor', function(widgets, $compile, otEditPathHelper) {
  return {
    restrict: 'E',
    link: function(scope, elm, attr) {

      scope.$watch(function (scope) {
        return scope.$parent.$eval(attr.value);
      }, function (val, old, scope) {
        scope.value = val;
      });

      scope.$watch(function(scope){
        return ['fields', scope.field.id, scope.locale.name];
      }, function(value, old, scope){
        scope.path = value;
      }, true);

      otEditPathHelper.injectInto(scope);

      // Widgets
      var widget = widgets.editor(scope.field.type, attr.editor);

      elm.html(widget.template);
      elm.on('blur', '*', function() {
        scope.$apply(function (scope) {
          scope.$emit('inputBlurred', scope.field.id);
        });
      });
      $compile(elm.contents())(scope);
      if(typeof widget.link === 'function') {
        widget.link(scope, elm, attr);
      }
    }
  };
});
