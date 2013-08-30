'use strict';

angular.module('contentful').controller('EntryEditorCtrl', function EntryEditorCtrl($scope, validation, can) {
  $scope.$watch('tab.params.entry', 'entry=tab.params.entry');
  $scope.$watch(function entryEditorEnabledWatcher(scope) {
    return !scope.entry.isArchived() && can('update', scope.entry.data);
  }, function entryEditorEnabledHandler(enabled, old, scope) {
    scope.otDisabled = !enabled;
  });

  $scope.tab.closingMessage = 'You have unpublished changes.';
  $scope.tab.closingMessageDisplayType = 'tooltip';

  $scope.$watch('spaceContext.entryTitle(entry)', function(title, old, scope) {
    scope.tab.title = title;
  });

  $scope.$on('entityDeleted', function (event, entry) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (entry === scope.entry) {
        scope.tab.close();
      }
    }
  });

  $scope.$on('otRemoteOp', function (event) {
    event.currentScope.otUpdateEntity();
  });

  $scope.$watch('spaceContext.publishedTypeForEntry(entry).data', function(data) {
    if (!data) return;
    var locales = $scope.spaceContext.space.getPublishLocales(); // TODO: watch this, too
    $scope.entrySchema = validation.fromContentType(data, locales);
  });

  // TODO This can probably be removed since we always keep the entity in sync
  $scope.publishedAt = function(){
    if (!$scope.otDoc) return;
    var val = $scope.otDoc.getAt(['sys', 'publishedAt']);
    if (val) {
      return new Date(val);
    } else {
      return undefined;
    }
  };

  $scope.$watch('entry.data.sys.publishedVersion', function (publishedVersion, oldVersion, scope) {
    if (publishedVersion > oldVersion) scope.validate();
  });

  $scope.$watch(function (scope) {
    if (scope.otDoc && scope.entry) {
      if (angular.isDefined(scope.entry.data.sys.publishedVersion))
        return scope.otDoc.version > scope.entry.data.sys.publishedVersion + 1;
      else
        return 'draft';
    } else {
      return undefined;
    }
  }, function (modified, old, scope) {
    if (modified !== undefined) scope.tab.dirty = modified;
  });

  $scope.$watch(function (scope) {
    return _.pluck(scope.spaceContext.activeLocales, 'code');
  }, updateFields, true);
  $scope.$watch('spaceContext.space.getDefaultLocale()', updateFields);
  $scope.$watch('preferences.showDisabledFields', updateFields);
  $scope.$watch(function () { return errorPaths; }, updateFields);
  $scope.$watch('spaceContext.publishedTypeForEntry(entry).data.fields', updateFields, true);
  var errorPaths = {};

  function updateFields(n, o ,scope) {
    var et = scope.spaceContext.publishedTypeForEntry(scope.entry);
    if (!et) return;
    scope.fields = _(et.data.fields).reduce(function (acc, field) {
      if (!field.disabled || scope.preferences.showDisabledFields || errorPaths[field.id]) {
        var locales;
        if (field.localized) {
          locales = scope.spaceContext.activeLocales;
        } else {
          locales = [scope.spaceContext.space.getDefaultLocale()];
        }
        var errorLocales = _.map(errorPaths[field.id], function (code) {
          return scope.spaceContext.getPublishLocale(code);
        });
        locales = _.union(locales, errorLocales);
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

  var firstValidate = $scope.$on('otBecameEditable', function (event) {
    var scope = event.currentScope;
    if (!_.isEmpty(scope.entry.data.fields)) scope.validate();
    firstValidate();
  });

  $scope.$watch('fields', function (fields, old, scope) {
    scope.showLangSwitcher = _.some(fields, function (field) {
      return field.localized;
    });
  });
  
  $scope.$watch('validationResult.errors', function (errors) {
    errorPaths = {};
    $scope.hasErrorOnFields = false;

    _.each(errors, function (error) {
      if (error.path[0] !== 'fields') return;
      var field      = error.path[1];
      errorPaths[field] = errorPaths[field] || [];

      if (error.path.length == 1 && error.path[0] == 'fields') {
        $scope.hasErrorOnFields = error.path.length == 1 && error.path[0] == 'fields';
      } else if (error.path.length == 2) {
        var allCodes = _.pluck($scope.spaceContext.publishLocales, 'code');
        errorPaths[field].push.apply(errorPaths[field], allCodes);
      } else {
        var localeCode = error.path[2];
        errorPaths[field].push(localeCode);
      }
      errorPaths[field] = _.unique(errorPaths[field]);
    });
  });


  $scope.headline = function(){
    return this.spaceContext.entryTitle(this.entry);
  };

});
