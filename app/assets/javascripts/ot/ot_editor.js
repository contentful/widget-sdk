'use strict';

angular.module('contentful').directive('otEditor', function ($parse, notification) {
  return {
    require: ['ngModel', '^otPath'],
    link: function (scope, elem, attr, controllers) {
      var ngModelCtrl = controllers[0];
      var getInternal = $parse(attr.otEditor),
          setInternal = getInternal.setter;
      var getExternal = $parse(attr.ngModel),
          setExternal = getExternal.setter;

      ngModelCtrl.$render = function () {
        setInternal(scope, ngModelCtrl.$viewValue);
      };

      scope.$on('otValueChanged', function(event, path, value){
        if (path === event.currentScope.otPath) {
          setExternal(event.currentScope, value);
        }
      });

      scope.changeHandler = function(value) {
        scope.otChangeValue(value, function (err, value) {
          if (!err) {
            ngModelCtrl.$setViewValue(value);
          } else {
            notification.serverError('There has been a problem saving the change', err);
          }
        });
      };

    }
  };
});
