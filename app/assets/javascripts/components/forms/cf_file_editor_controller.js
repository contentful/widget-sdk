'use strict';

angular.module('contentful').controller('CfFileEditorCtrl', function ($scope) {

  $scope.$on('fieldDataUpdated', function(event, fieldData){
    if(!angular.equals(fieldData.value, fieldData.oldValue)){
      if(_.isNull(fieldData.oldValue) && !_.isNull(fieldData.value))
        $scope.$emit('fileUploaded', fieldData.value);
      if(_.isNull(fieldData.value))
        $scope.$emit('fileRemoved', fieldData.oldValue);
    }
  });

});
