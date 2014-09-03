'use strict';

// To build a nice widget that works with ShareJS and updates the local model correctly
// it needs to require an ngModelCtrl and do this:
//
// var ngModelGet = $parse(attr.ngModel),
//     ngModelSet = ngModelGet.assign;
//
// changeHandler (widget value changed internally)
//   ShareJS submit
//    success: ngModelCtrl.$setViewValue(internal value)
//    fail: reset internal value to ngModelCtr.$modelValue
//          OR simply abort if nothing has been changed on the scope
//
// ngModelCtrl.$render
//    set internal value to ngModelCtrl.$viewValue
//
// otValueChanged
//   ngModelSet(scope, incomingValue)
//
// This is implemented in a generic fashion in otBindInternal

angular.module('contentful').directive('cfFieldEditor', ['$injector', function($injector) {
  var $compile    = $injector.get('$compile');
  var widgetTypes = $injector.get('widgetTypes');
  
  return {
    restrict: 'C',
    require: '^otPath',
    controller: 'CfFieldEditorController',
    link: function (scope, element) {
      var childScope;
      scope.$watch('widget.widgetType', installWidget);
      scope.$on('$destroy', clearChildScope);

      function installWidget(widgetType) {
        if (childScope) {
          childScope.$destroy();
          childScope = null;
          element.empty();
        }
        if (widgetType) {
          var template = widgetTypes.widgetTemplate(widgetType);
          childScope = scope.$new();
          var $widget = $(template);
          element.append($widget);
          $compile($widget)(childScope);
        }
      }

      function clearChildScope() {
        childScope = null;
      }
    }
  };
}]);
