'use strict';
angular.module('contentful').controller('CfFieldEditorController', ['$scope', '$attrs', '$injector', function CfFieldEditorController($scope, $attrs, $injector){
  var $parse = $injector.get('$parse');

  // Write back local value changes to the entity
  // Necessary because the widgets can't access the entry directly, only the value variable
  var getEntity = $parse($attrs.cfEditorEntity);

  $scope.field = $scope.widget && $scope.widget.field;
  $scope.fieldData = {value: getExternal()};
  var oldValue = $scope.fieldData.value;


  $scope.$watch('widget.field', 'field=widget.field');
  $scope.$watch(function (scope) {
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
      setExternal(external);
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
    var entity = getEntity($scope);
    if (!entity.data.fields) {
      entity.data.fields = {};
    }
    if (!entity.data.fields[$scope.field.id]) {
      entity.data.fields[$scope.field.id] = {};
    }
    entity.data.fields[$scope.field.id][$scope.locale.code] = value;
    return value;
  }

  function getExternal() {
    var entity = getEntity($scope);
    if (!entity.data.fields) {
      return undefined;
    }
    if (!entity.data.fields[$scope.field.id]) {
      return undefined;
    }
    return entity.data.fields[$scope.field.id][$scope.locale.code];
  }

}]);
