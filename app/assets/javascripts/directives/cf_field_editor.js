'use strict';

angular.module('contentful/directives').directive('cfFieldEditor', function(widgets, $compile, subdocClient) {
  return {
    restrict: 'E',
    scope: {
      type: '=',
      fieldId: '=',
      doc: '=',
      locale: '=',
      bucketContext: '=',
      value: '='
    },
    link: function(scope, elm, attr) {
      scope.$watch(function(scope){
        return ['fields', scope.fieldId, scope.locale];
      }, function(value, old, scope){
        scope.path = value;
      }, true);

      subdocClient.injectInto(scope);

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
