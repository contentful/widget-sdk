define([
  'controllers',
  'lodash',
  'sharejs',

  'controllers/bucket_controller'
], function(controllers, _, sharejs){
  'use strict';

  return controllers.controller('EntryEditorCtrl', function($scope, client) {
    function toKey(sys) {
      var type = (sys.type === 'archivedEntry') ? 'entry' : sys.type;
      var parts = [type, sys.id];
      if (sys.bucket) parts.unshift('bucket', sys.bucket);
      return parts.join(':');
    }
    // console.log($scope.originalEntry)
    $scope.connection  = sharejs.open(toKey($scope.originalEntry.data.sys), 'json', 'http://localhost:8000/channel', function(err, doc) {
      console.log("connection open", doc);
      $scope.$apply(function(scope){
        scope.doc = doc;
      })
    });

    $scope.entry = $scope.originalEntry.clone();
    $scope.locale = 'en-US'

    // _($scope.entryType.fields).each(function(field){
    //   (function(fieldName){
    //     $scope.watch(fieldName, function(value){
    //       $scope.doc.at(fieldName).set(value);
    //     })
    //   })("entry.data.fields"+field+"['en-US']")
    // })

    $scope.sendOp = function(fieldId){
      console.log("Sending Op for %s, %s", fieldId, $scope.locale);
      var field = $scope.doc.at(['fields', fieldId, $scope.locale]);
      field.set($scope.entry.data.fields[fieldId][$scope.locale]);
    }

    $scope.exitEditor = function(save){
      $scope.doc.close(function(){
        $scope.connection.disconnect();
        $scope.$emit('exitEditor');
      })
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
