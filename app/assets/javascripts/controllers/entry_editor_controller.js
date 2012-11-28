define([
  'controllers',
  'lodash',

  'services/sharejs',
  'controllers/bucket_controller'
], function(controllers, _){
  'use strict';

  return controllers.controller('EntryEditorCtrl', function($scope, sharejs) {
    function toKey(sys) {
      var type = (sys.type === 'archivedEntry') ? 'entry' : sys.type;
      var parts = [type, sys.id];
      if (sys.bucket) parts.unshift('bucket', sys.bucket);
      return parts.join(':');
    }

    var shareCallbackSync = true;
    sharejs.open(toKey($scope.originalEntry.data.sys), 'json', function(err, doc) {
      if (!err) {
        if (shareCallbackSync) {
          $scope.doc = doc;
        } else {
          $scope.$apply(function(scope){
            scope.doc = doc;
          });
        }
      } else {
        console.log('Error opening connection', err)
      }
    });
    shareCallbackSync = false;

    $scope.entry = $scope.originalEntry.clone();
    $scope.locale = 'en-US'

    $scope.exitEditor = function(){
      var shareCallbackSync = true;
      $scope.doc.close(function(){
        if (shareCallbackSync) {
          $scope.$emit('exitEditor');
        } else {
          $scope.$apply(function(scope){
            scope.$emit('exitEditor');
          })
        }
      })
      shareCallbackSync = false;
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

    $scope.fields = function(){
      return $scope.entryType.data.fields;
    }

  });
});
