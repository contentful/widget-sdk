'use strict';

angular.module('contentful/directives').directive('cfFieldEditor', function(widgets, $compile, otEditPathHelper) {
  return {
    restrict: 'E',
    scope: {
      type: '=',
      fieldId: '=',
      doc: '=',
      locale: '=',
      bucketContext: '=',
      //value: '='
    },
    link: function(scope, elm, attr) {

      scope.$watch(function (scope) {
        return scope.$parent.$eval(attr.value);
      }, function (val, old, scope) {
        scope.value = val;
      });

      scope.$watch(function(scope){
        return ['fields', scope.fieldId, scope.locale];
      }, function(value, old, scope){
        scope.path = value;
      }, true);

      otEditPathHelper.injectInto(scope);

      // Widgets
      var widget = widgets.editor(scope.type, attr.editor);

      elm.html(widget.template);
      elm.on('blur', '*', function() {
        scope.$emit('inputBlurred', scope.fieldId);
      });
      $compile(elm.contents())(scope);
      if(typeof widget.link === 'function') {
        widget.link(scope, elm, attr);
      }
    }
  };
});
