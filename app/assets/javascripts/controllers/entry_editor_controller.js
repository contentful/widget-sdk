'use strict';

angular.module('contentful/controllers').controller('EntryEditorCtrl', function EntryEditorCtrl($scope, ShareJS) {
  $scope.$watch('tab.params.entry',     'entry=tab.params.entry');
  $scope.$watch('bucketContext.bucket.data.locales.default', 'locale=bucketContext.bucket.data.locales.default');

  $scope.$watch('entry', function(entry, old, scope){
    if (!entry) return;

    if (scope.shareJSstarted) {
      console.log('Fatal error, shareJS started twice');
    }
    ShareJS.open(entry, function(err, doc) {
      if (!err) {
       scope.$apply(function(scope){
          scope.doc = doc;
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

  $scope.$watch('bucketContext.entryTitle(entry)', function(title, old, scope) {
    scope.tab.title = title;
  });

  $scope.$on('inputBlurred', function(event) {
    event.stopPropagation();
    event.currentScope.updateFromShareJSDoc();
  });

  $scope.updateFromShareJSDoc = function() {
    this.entry.update(this.doc.snapshot);
  };

  $scope.canPublish = function() {
    if (!$scope.doc) return false;
    return !$scope.doc.getAt(['sys', 'archivedAt']);
  };

  $scope.publish = function () {
    var version = $scope.doc.version;
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
    var verb = this.tab.params.mode == 'edit' ? 'Editing' : 'Creating';
    return verb + ' ' + this.bucketContext.typeForEntry(this.entry).data.name + ': ' + this.bucketContext.entryTitle(this.entry);
  };

});
