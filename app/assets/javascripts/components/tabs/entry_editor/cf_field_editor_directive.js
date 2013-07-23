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

angular.module('contentful').directive('cfFieldEditor', function(widgets, $compile, $log) {
  return {
    restrict: 'C',
    require: '^otPath',
    link: function(scope, elm, attr) {
      // Write back local value changes to the entity
      // Necessary because the widgets can't access the entry directly, only the value variable
      scope.fieldData = {value: getExternal()};
      var oldValue = scope.fieldData.value;

      scope.$watch(function (scope) {
        var external = getExternal();
        if (external === scope.fieldData.value) {
          if (oldValue === scope.fieldData.value) {
            // Everything in sync, nothing changed
            return;
          } else {
            // internal and external updated in sync, old Value somehow left behind
            // shouldn't happen but isn't that bad. means someone bypassed this channel
            // happens i.e. if otRemoteOp event is processed both inside AND outside the
            // cfFieldEditor
            oldValue = scope.fieldData.value;
          }
        } else if (external !== oldValue && scope.fieldData.value !== oldValue) {
          // Both changed. shouldn't happen
          //$log.warn('External and internal value changed in cfFieldEditor', scope);
          external = oldValue = scope.fieldData.value;
          scope.entry.data.fields[scope.field.id][scope.locale.code] = external;
        } else if (external !== oldValue) {
          // external changed, update internal
          scope.fieldData.value = oldValue = external;
          //$log.log('update internal', scope.field.id, scope.fieldData.value);
        } else if (scope.fieldData.value !== oldValue) {
          // internal changed, update external
          setExternal(oldValue = scope.fieldData.value);
          //$log.log('update external', scope.field.id, scope.fieldData.value);
        }
      });

      function setExternal(value) {
        if (!scope.entry.data.fields) {
          scope.entry.data.fields = {};
        }
        if (!scope.entry.data.fields[scope.field.id]) {
          scope.entry.data.fields[scope.field.id] = {};
        }
        scope.entry.data.fields[scope.field.id][scope.locale.code] = value;
        return value;
      }

      function getExternal() {
        if (!scope.entry.data.fields) {
          return undefined;
        }
        if (!scope.entry.data.fields[scope.field.id]) {
          return undefined;
        }
        return scope.entry.data.fields[scope.field.id][scope.locale.code];
      }

      var widget = widgets.editor(scope.field.type, attr.editor);
      elm.html(widget.template);
      $compile(elm.contents())(scope);
      if(typeof widget.link === 'function') widget.link(scope, elm, attr);
    }
  };
});
