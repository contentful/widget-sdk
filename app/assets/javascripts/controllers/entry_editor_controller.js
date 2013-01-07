define([
  'controllers',
  'lodash',

  'services/sharejs',
  'controllers/bucket_controller'
], function(controllers, _){
  'use strict';

  return controllers.controller('EntryEditorCtrl', function($scope, ShareJS) {
    $scope.$watch('tab.params.entry',     'entry=tab.params.entry');
    $scope.$watch('tab.params.bucket.data.locales.default', 'locale=tab.params.bucket.data.locales.default');

    $scope.$watch('entry', function(entry, old, scope){
      if (!entry) return;
      scope.entryType = scope.typeForEntry(entry);

      if (scope.shareJSstarted) {
        console.log('Fatal error, shareJS started twice');
      }
      // TODO: This will currently fail horribly if the entry is replaced because everything is still bound
      // to the old entry
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

    $scope.typeForEntry = function(entry) {
      return _(this.bucketContext.entryTypes).find(function(et) {
        return et.data.sys.id === entry.data.sys.entryType;
      });
    };

    $scope.exitEditor = function(){
      $scope.doc.close(function(){
        $scope.$apply(function(scope){
          scope.tab.close();
        });
      });
    };

    $scope.$on('inputBlurred', function(event) {
      event.stopPropagation();
      event.currentScope.updateFromShareJSDoc();
    });

    $scope.updateFromShareJSDoc = function() {
      this.entry.update(this.doc.parent().value());
    };

    $scope.canPublish = function() {
      if (!$scope.doc) return false;
      return !$scope.doc.parent().subdoc(['sys', 'archivedAt']).peek();
    };

    //TODO: Same kind of controls for archiving/Don't allow editing at all for archived entries
    
    $scope.publish = function () {
      var version = $scope.doc.version();
      $scope.entry.publish(version, function (err) {
        $scope.$apply(function(scope){
          if (err) {
            window.alert('could not publish, version mismatch');
          } else {
            scope.updateFromShareJSDoc();
          }
        });
      });
    };

    $scope.unpublish = function () {
      $scope.entry.unpublish(function (err) {
        $scope.$apply(function(scope){
          if (err) {
            window.alert('could not unpublish, version mismatch');
          } else {
            scope.bucketContext.refreshPublishedEntryTypes();
            scope.updateFromShareJSDoc();
          }
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
