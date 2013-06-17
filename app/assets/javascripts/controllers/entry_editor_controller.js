'use strict';

angular.module('contentful').controller('EntryEditorCtrl', function EntryEditorCtrl($scope, ShareJS, validation, can) {
  $scope.$watch('tab.params.entry', 'entry=tab.params.entry');
  $scope.$watch(function entryEditorEnabledWatcher(scope) {
    return !scope.entry.isArchived() && can('update', scope.entry.data);
  }, function entryEditorEnabledHandler(enabled, old, scope) {
    scope.otDisabled = !enabled;
  });

  $scope.$on('tabClosed', function(event, tab) {
    if (tab==event.currentScope.tab) {
      if (event.currentScope.otDoc) event.currentScope.otDoc.close();
    }
  });

  $scope.$watch('spaceContext.entryTitle(entry)', function(title, old, scope) {
    scope.tab.title = title;
  });

  $scope.$on('inputBlurred', function(event) {
    event.stopPropagation();
    event.currentScope.otUpdateEntity();
  });

  $scope.$on('otRemoteOp', function (event) {
    event.currentScope.otUpdateEntity();
  });

  $scope.$watch('spaceContext.publishedTypeForEntry(entry).data', function(data) {
    if (!data) return;
    var locales = $scope.spaceContext.space.getPublishLocales(); // TODO: watch this, too
    $scope.entrySchema = validation.fromContentType(data, locales);
  });

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
    return _.pluck(scope.spaceContext.activeLocales, 'code');
  }, updateFields, true);
  $scope.$watch('spaceContext.space.getDefaultLocale()', updateFields);
  $scope.$watch(function () { return errorPaths; }, updateFields);
  $scope.$watch('spaceContext.publishedTypeForEntry(entry).data.fields', updateFields, true);
  var errorPaths = {};
  function updateFields(n, o ,scope) {
    var et = scope.spaceContext.publishedTypeForEntry(scope.entry);
    if (!et) return;
    scope.fields = _(et.data.fields).reduce(function (acc, field) {
      if (!field.disabled || errorPaths[field.id]) {
        var locales;
        if (field.localized) {
          locales = scope.spaceContext.activeLocales;
          var errorLocales = _.map(errorPaths[field.id], function (code) {
            return scope.spaceContext.getPublishLocale(code);
          });
          locales = _.union(locales, errorLocales);
        } else {
          locales = [scope.spaceContext.space.getDefaultLocale()];
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
  
  $scope.$watch('validationResult.errors', function (errors) {
    errorPaths = {};
    _.each(errors, function (error) {
      if (error.path[0] !== 'fields') return;
      var field  = error.path[1];
      var locale = error.path[2];
      errorPaths[field] = errorPaths[field] || [];
      errorPaths[field].push(locale) ;
      errorPaths[field] = _.unique(errorPaths[field], 'code');
    });
  });


  $scope.headline = function(){
    return this.spaceContext.entryTitle(this.entry);
  };

});
