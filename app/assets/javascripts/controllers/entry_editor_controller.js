define([
  'controllers',

  'services/sharejs_document',
  'controllers/bucket_controller'
], function(controllers){
  'use strict';

  return controllers.controller('EntryEditorCtrl', function($scope, SharejsDocument) {
    SharejsDocument.open($scope.originalEntry, function(err, doc) {
      if (!err) {
        $scope.$apply(function(scope){
          scope.doc = doc.subdoc('fields');
        });
      } else {
        console.log('Error opening connection', err);
      }
    });

    $scope.entry = $scope.originalEntry.clone();
    $scope.locale = 'en-US';

    $scope.exitEditor = function(){
      $scope.doc.close(function(){
        $scope.$apply(function(scope){
          scope.$emit('exitEditor');
        });
      });
    };

    $scope.fields = function(){
      return $scope.entryType.data.fields;
    };

  });
});
