define([
  'controllers',
  'lodash',

  'services/sharejs',
  'controllers/bucket_controller'
], function(controllers, _){
  'use strict';

  return controllers.controller('EntryTypeEditorCtrl', function($scope, ShareJS) {
    $scope.$watch('tab.params.entryType', 'entryType=tab.params.entryType');


    $scope.exitEditor = function(){
      $scope.doc.close(function(){
        $scope.$apply(function(scope){
          scope.tab.close();
        });
      });
    };

    $scope.entryTypePersisted = function() {
      return !!this.entryType.getId();
    };

    //$scope.$on('inputBlurred', function(event) {
      //event.stopPropagation();
      //event.currentScope.updateFromShareJSDoc();
    //});

    $scope.updateFromShareJSDoc = function() {
      this.entryType.update(this.doc.value());
    };

    $scope.headline = function(){
      var verb = $scope.tab.params.mode == 'edit' ? 'Editing' : 'Creating';
      return verb + ' Content Type';
    };

  });
});

