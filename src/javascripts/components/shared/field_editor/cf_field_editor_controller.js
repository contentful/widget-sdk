'use strict';

//
// Sync external field data and and Form Widget data.
//
// The path to the external field data is given by the
// 'cf-field-editor' attribute. The data for the form widget is
// provided on `scope.fieldData`.
//

angular.module('contentful').controller('CfFieldEditorController', ['$scope', '$attrs', '$parse', function CfFieldEditorController($scope, $attrs, $parse){

  var getExternal = $parse($attrs.cfFieldEditor),
      setExternal = getExternal.assign;

  $scope.fieldData = {value: getExternal()};
  var oldValue = $scope.fieldData.value;


  $scope.$watch(function (scope) {
    var external = getExternal($scope);
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
      external = oldValue = scope.fieldData.value;
      setExternal($scope, external);
    } else if (external !== oldValue) {
      // external changed, update internal
      scope.fieldData.value = oldValue = external;
    } else if (scope.fieldData.value !== oldValue) {
      // internal changed, update external
      setExternal($scope, oldValue = scope.fieldData.value);
    }
  });


}]);
