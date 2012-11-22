define([
  'controllers',
  'lodash',

  'controllers/bucket_controller'
], function(controllers, _){
  'use strict';

  return controllers.controller('EntryEditorCtrl', function($scope, client) {
    $scope.tempEntry = $scope.entry;

    $scope.exitEditor = function(save){
      if (save) {
        $scope.tempEntry.save(function(err, res){
          $scope.$apply(function($scope){
            if (!err) {
              $scope.entry.writeBack($scope.tempEntry);
            } else {
              alert(err);
            }
            $scope.$emit('exitEditor');
          })
        })
      } else {
        $scope.$emit('exitEditor');
      }
    };

    $scope.stringFields = function(fields){
      return _(fields).reduce(function(list, value, key){
        if (_(value['en-US']).isString()) {
          return list.concat(key);
        } else {
          return list;
        }
      }, []);
    }

  });
});
