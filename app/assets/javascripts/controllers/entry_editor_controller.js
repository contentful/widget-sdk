define([
  'controllers',

  'services/sharejs',
  'controllers/bucket_controller'
], function(controllers){
  'use strict';

  return controllers.controller('EntryEditorCtrl', function($scope, ShareJS) {
    $scope.$watch('tab.params.entry',     'entry=tab.params.entry');
    $scope.$watch('tab.params.entryType', 'entryType=tab.params.entryType');
    $scope.$watch('tab.params.bucket.data.locales.default', 'locale=tab.params.bucket.data.locales.default');

    $scope.$watch('entry', function(entry, old, scope){
      if (!entry) return;
      if (scope.shareJSstarted) {
        console.log('Fatal error, shareJS started twice');
      }

      ShareJS.open(entry, function(err, doc) {
        if (!err) {
          scope.$apply(function(scope){
            scope.doc = doc.subdoc('fields');
          });
        } else {
          console.log('Error opening connection', err);
        }
      });
      scope.shareJSstarted = true;
    });

    $scope.exitEditor = function(){
      $scope.doc.close(function(){
        $scope.$apply(function(scope){
          scope.tab.close();
        });
      });
    };

    $scope.publish = function () {
      var version = $scope.doc.version();
      $scope.entry.publish(version, function (err) {
        $scope.$apply(function(){
          if (err) window.alert('could not publish, version mismatch');
        });
      });
    };

    $scope.unpublish = function () {
      $scope.entry.unpublish(function (err) {
        $scope.$apply(function(){
          if (err) window.alert('Error');
        });
      });
    };

    $scope.publishedVersion= function(){
      return $scope.doc.parent().subdoc(['sys', 'publishedVersion']).peek();
    };

    $scope.publishedAt = function(){
      if (!$scope.doc) return;
      var val = $scope.doc.parent().subdoc(['sys', 'publishedAt']).peek();
      if (val) {
        return new Date(val);
      } else {
        return undefined;
      }
    };

    $scope.fields = function(){
      if ($scope.entryType) {
        return $scope.entryType.data.fields;
      }
    };

    $scope.headline = function(){
      var verb = $scope.tab.params.mode == 'edit' ? 'Editing' : 'Creating';
      return verb + ' ' + $scope.entryType.data.name + ': ' + $scope.entry.getName();
    };

  });
});
