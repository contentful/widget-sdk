'use strict';

angular.module('contentful/directives').directive('ngModelOnblur', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elm, attr, ngModelCtrl) {
      if (attr.type === 'radio' || attr.type === 'checkbox') return;

      elm.unbind('input').unbind('keydown').unbind('change');

      var idleTimer;

      function submit(){
        clearTimeout(idleTimer);
        scope.$apply(function() {
          ngModelCtrl.$setViewValue(elm.val());
        });
      }

      elm.bind('keydown keypress', function(event) {
        if (event.which === 13) {
          submit();
        } else {
          clearTimeout(idleTimer);
          idleTimer = setTimeout(submit, 400);
        }
      });

      elm.bind('blur', submit);
    }
  };
});
