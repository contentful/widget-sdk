'use strict';

angular.module('contentful').controller('EntryEditorCtrl', ['$scope', '$injector', function EntryEditorCtrl($scope, $injector) {
  var $controller       = $injector.get('$controller');
  var addCanMethods     = $injector.get('addCanMethods');
  var sentry            = $injector.get('sentry');
  var validation        = $injector.get('validation');

  // Initialization
  $scope.$watch('tab.params.entry', 'entry=tab.params.entry');
  addCanMethods($scope, 'entry');

  // Tab related stuff
  $scope.tab.closingMessage = 'You have unpublished changes.';
  $scope.tab.closingMessageDisplayType = 'tooltip';
  $scope.$watch('spaceContext.entryTitle(entry)', function(title, old, scope) {
    scope.tab.title = title;
  });
  $scope.$watch(function (scope) {
    if (scope.otDoc && scope.entry) {
      if (angular.isDefined(scope.entry.getPublishedVersion()))
        return scope.otDoc.version > scope.entry.getPublishedVersion() + 1;
      else
        return 'draft';
    } else {
      return undefined;
    }
  }, function (modified, old, scope) {
    if (modified !== undefined) scope.tab.dirty = modified;
  });
  $scope.$on('entityDeleted', function (event, entry) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (entry === scope.entry) {
        scope.tab.close();
      }
    }
  });

  // OT Stuff
  $scope.$watch(function entryEditorEnabledWatcher(scope) {
    return !scope.entry.isArchived() && scope.can('update', scope.entry.data);
  }, function entryEditorEnabledHandler(enabled, old, scope) {
    scope.otDisabled = !enabled;
  });
  $scope.$on('otRemoteOp', function (event) {
    event.currentScope.otUpdateEntity();
  });

  // Validations
  $scope.errorPaths = {};
  $scope.$watch('spaceContext.publishedTypeForEntry(entry).data', function(data) {
    if (!data) return;
    var locales = $scope.spaceContext.space.getPublishLocales(); // TODO: watch this, too
    $scope.entrySchema = validation.fromContentType(data, locales);
  });
  $scope.$watch('entry.getPublishedVersion()', function (publishedVersion, oldVersion, scope) {
    if (publishedVersion > oldVersion) scope.validate();
  });
  var firstValidate = $scope.$on('otBecameEditable', function (event) {
    var scope = event.currentScope;
    if (!_.isEmpty(scope.entry.data.fields)) scope.validate();
    firstValidate();
    firstValidate = null;
  });
  $scope.$watch('validationResult.errors', function (errors) {
    var et = $scope.spaceContext.publishedTypeForEntry($scope.entry);
    $scope.errorPaths = {};
    $scope.hasErrorOnFields = false;

    _.each(errors, function (error) {
      if (error.path[0] !== 'fields') return;
      var fieldId      = error.path[1];
      var field        = _.find(et.data.fields, {id: fieldId});

      if(error.path.length > 1) {
        $scope.errorPaths[fieldId] = $scope.errorPaths[fieldId] || [];
      }

      if(!field) sentry.captureError('Field object does not exist', {
        data: {
          fieldId: fieldId,
          field: field,
          dataFields: et.data.fields
        }
      });

      if (error.path.length == 1 && error.path[0] == 'fields') {
        $scope.hasErrorOnFields = error.path.length == 1 && error.path[0] == 'fields';
      } else if (error.path.length == 2) {
        var locales = field.localized ? $scope.spaceContext.publishLocales : [$scope.spaceContext.space.getDefaultLocale()];
        var allCodes = _.pluck(locales, 'code');
        $scope.errorPaths[fieldId].push.apply($scope.errorPaths[fieldId], allCodes);
      } else {
        var localeCode = error.path[2];
        $scope.errorPaths[fieldId].push(localeCode);
      }
      $scope.errorPaths[fieldId] = _.unique($scope.errorPaths[fieldId]);
    });
  });

  // Building the form
  $scope.formWidgetsController = $controller('FormWidgetsController', {$scope: $scope});

  // Helper methods on the scope
  $scope.$watch('fields', function (fields, old, scope) {
    scope.showLangSwitcher = _.some(fields, function (field) {
      if(!field) {
        sentry.captureError('Field object does not exist', {
          data: {
            field: field,
            fields: fields
          }
        });
        return false;
      }

      return field.localized;
    });
  });

  $scope.headline = function(){
    return this.spaceContext.entryTitle(this.entry);
  };

}]);
