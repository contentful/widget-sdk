'use strict';

angular.module('contentful/controllers').controller('EntryEditorCtrl', function EntryEditorCtrl($scope, ShareJS) {
  $scope.$watch('tab.params.entry',     'entry=tab.params.entry');
  $scope.$watch('bucketContext.bucket.getDefaultLocale()', 'locale=bucketContext.bucket.getDefaultLocale()');

  $scope.$watch('entry', function(entry, old, scope){
    if (!entry || entry.isArchived()) return; //TODO: watch isArchived status and adapt doc
    ShareJS.open(entry, function(err, doc) {
      if (!err) {
       scope.$apply(function(scope){
          scope.doc = doc;
        });
      } else {
        console.log('Error opening connection', err);
      }
    });
  });

  $scope.$on('tabClosed', function(event, tab) {
    if (tab==event.currentScope.tab) {
      if (event.currentScope.doc) event.currentScope.doc.close();
    }
  });

  $scope.$watch('bucketContext.entryTitle(entry)', function(title, old, scope) {
    scope.tab.title = title;
  });

  $scope.$on('inputBlurred', function(event) {
    event.stopPropagation();
    event.currentScope.updateFromShareJSDoc();
  });

  $scope.updateFromShareJSDoc = function() {
    if (this.doc) {
      this.entry.update(this.doc.snapshot);
    }
  };

  $scope.canPublish = function() {
    if (!$scope.doc) return false;
    return !$scope.doc.getAt(['sys', 'archivedAt']);
  };

  $scope.archive = function() {
    $scope.entry.archive(function() {
      $scope.$apply();
    });
  };

  $scope.publish = function () {
    var version = $scope.doc.version;
    $scope.entry.publish(version, function (err) {
      $scope.$apply(function(scope){
        if (err) {
          console.log('publish error', err);
          if (err.body.sys.id == 'validationFailed') {
            window.alert('could not publish, validation failed');
          } else {
            window.alert('could not publish, version mismatch');
          }
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
          scope.updateFromShareJSDoc();
        }
      });
    });
  };

  $scope.publishedVersion= function(){
    return $scope.doc.getAt(['sys', 'publishedVersion']);
  };

  $scope.publishedAt = function(){
    if (!$scope.doc) return;
    var val = $scope.doc.getAt(['sys', 'publishedAt']);
    if (val) {
      return new Date(val);
    } else {
      return undefined;
    }
  };

  $scope.fields = function(){
    var et = this.bucketContext.typeForEntry(this.entry);
    if (et) {
      return et.data.fields;
    }
  };

  $scope.headline = function(){
    if (this.tab.params.mode == 'create') {
      return 'Creating ' + this.bucketContext.typeForEntry(this.entry).data.name;
    } else {
      return this.bucketContext.entryTitle(this.entry);
    }
  };

});
