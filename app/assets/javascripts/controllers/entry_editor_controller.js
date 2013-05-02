angular.module('contentful/controllers').controller('EntryEditorCtrl', function EntryEditorCtrl($scope, ShareJS, validation) {
  'use strict';

  $scope.$watch('tab.params.entry', 'entry=tab.params.entry');
  $scope.$watch('entry.isArchived()', function (archived, old, scope) {
    scope.otDisabled = !!archived;
  });

  $scope.$on('tabClosed', function(event, tab) {
    if (tab==event.currentScope.tab) {
      if (event.currentScope.otDoc) event.currentScope.otDoc.close();
    }
  });

  $scope.$watch('bucketContext.entryTitle(entry)', function(title, old, scope) {
    scope.tab.title = title;
  });

  $scope.$on('inputBlurred', function(event) {
    event.stopPropagation();
    event.currentScope.otUpdateEntity();
  });

  $scope.$on('otRemoteOp', function (event) {
    event.currentScope.otUpdateEntity();
  });

  $scope.formValid = function () {
    if (!$scope.entryConstraint) {
      var entryType = this.bucketContext.publishedTypeForEntry(this.entry);
      var bucket = this.bucketContext.bucket;
      $scope.entryConstraint = validation.EntryType.parse(entryType.data, bucket).entryConstraint;
    }
    var entry = $scope.otDoc ? $scope.otDoc.getAt([]) : $scope.entry.data;
    var valid = $scope.entryConstraint.test(entry);
    return valid;
  };

  $scope.publishedAt = function(){
    if (!$scope.otDoc) return;
    var val = $scope.otDoc.getAt(['sys', 'publishedAt']);
    if (val) {
      return new Date(val);
    } else {
      return undefined;
    }
  };

  $scope.$watch(function (scope) {
    return _.pluck(scope.bucketContext.activeLocales, 'code');
  }, updateFields, true);
  $scope.$watch('bucketContext.bucket.getDefaultLocale()', updateFields);
  $scope.$watch('bucketContext.publishedTypeForEntry(entry).data.fields', updateFields, true);
  function updateFields(n, o ,scope) {
    var et = scope.bucketContext.publishedTypeForEntry(scope.entry);
    scope.fields = _(et.data.fields).reduce(function (acc, field) {
      if (!field.disabled) {
        var locales;
        if (field.localized) {
          locales = scope.bucketContext.activeLocales;
        } else {
          locales = [scope.bucketContext.bucket.getDefaultLocale()];
        }
        acc.push(inherit(field, locales));
      }
      return acc;
    }, []);

    function inherit(source, locales){
      var Clone = function () { };
      Clone.prototype = source;
      var clone = new Clone();
      clone.locales = locales;
      return clone;
    }
  }

  $scope.$watch('fields', function (fields, old, scope) {
    scope.showLangSwitcher = _.some(fields, function (field) {
      return field.localized;
    });
  });


  $scope.headline = function(){
    return this.bucketContext.entryTitle(this.entry);
  };

});
