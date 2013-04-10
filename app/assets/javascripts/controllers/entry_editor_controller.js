angular.module('contentful/controllers').controller('EntryEditorCtrl', function EntryEditorCtrl($scope, ShareJS, validation) {
  'use strict';

  $scope.$watch('tab.params.entry',     'entry=tab.params.entry');
  $scope.$watch('entry.isArchived()', function (archived, old, scope) {
    scope.otDisabled = archived;
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
    event.currentScope.otUpdateEntity();
  });

  $scope.$on('textIdle', function(event) {
    event.currentScope.otUpdateEntity();
  });

  $scope.formValid = function () {
    if (!$scope.entryConstraint) {
      var entryType = this.bucketContext.typeForEntry(this.entry);
      var bucket = this.bucketContext.bucket;
      $scope.entryConstraint = validation.EntryType.parse(entryType.data, bucket).entryConstraint;
    }
    var entry = $scope.doc ? $scope.doc.getAt([]) : $scope.entry.data;
    var valid = $scope.entryConstraint.test(entry);
    return valid;
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
      return _.reject(et.data.fields, function(f) {
        return f.disabled;
      });
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
