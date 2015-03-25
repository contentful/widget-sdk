'use strict';

angular.module('contentful').controller('EntryEditorController', ['$scope', '$injector', function EntryEditorController($scope, $injector) {
  var $controller       = $injector.get('$controller');
  var logger            = $injector.get('logger');
  var validation        = $injector.get('validation');

  // Initialization
  $scope.entityActionsController = $controller('EntityActionsController', {
    $scope: $scope,
    entityType: 'entry'
  });

  // Context related stuff
  $scope.context.closingMessage = 'You have unpublished changes.';
  $scope.context.closingMessageDisplayType = 'tooltip';
  $scope.$watch('spaceContext.entryTitle(entry)', function (title) {
    $scope.context.title = title;
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
    if (modified !== undefined) scope.context.dirty = modified;
  });
  $scope.$on('entityDeleted', function (event, entry) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (entry === scope.entry) {
        scope.closeState();
      }
    }
  });

  // OT Stuff
  $scope.$watch(function entryEditorEnabledWatcher(scope) {
    return !scope.entry.isArchived() && scope.permissionController.can('update', scope.entry.data).can;
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
    var locales = $scope.spaceContext.space.data.locales; // TODO: watch this, too
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

      if(!field) logger.logError('Field object does not exist', {
        data: {
          fieldId: fieldId,
          field: field,
          dataFields: et.data.fields
        }
      });

      if (error.path.length == 1 && error.path[0] == 'fields') {
        $scope.hasErrorOnFields = error.path.length == 1 && error.path[0] == 'fields';
      } else if (error.path.length == 2) {
        var locales = field.localized ? $scope.spaceContext.privateLocales : [$scope.spaceContext.space.getDefaultLocale()];
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
  $scope.$watch('spaceContext.publishedTypeForEntry(entry)', function (contentType) {
    $scope.formWidgetsController.contentType = contentType;
  });
  $scope.$watch('spaceContext.publishedTypeForEntry(entry).data.fields', function (contentTypeFields) {
    $scope.formWidgetsController.updateWidgets();
    if(contentTypeFields && contentTypeFields.length > 0){
      cleanupEntryFields(contentTypeFields);
    }
  }, true);


  // Helper methods on the scope
  $scope.getFieldValidationsOfType = function(field, type) {//TODO this should go in a service
    return _.filter(_.pluck(field.validations, type))[0];
  };

  $scope.$watch('widgets', function (widgets, old, scope) {
    scope.showLangSwitcher = _.some(widgets, function (widget) {
      if(!widget) {
        logger.logError('widget object does not exist', {
          data: {
            widget: widget,
            widgets: widgets
          }
        });
        return false;
      }

      return widget.field && widget.field.localized;
    });
  });

  $scope.headline = function(){
    return this.spaceContext.entryTitle(this.entry);
  };

  // Prevents badly created fields via the API from breaking the editor
  function cleanupEntryFields(contentTypeFields) {
    $scope.$watchGroup(['::entry', '::otDoc'], function (values) {
      if(!_.isEmpty($scope.entry.data.fields) && areValuesDefined(values)){
        _.each($scope.entry.data.fields, _.partial(setupFieldLocales, contentTypeFields));
      }
    });
  }

  function areValuesDefined(values) {
    return _.all(values, function(val){return !_.isUndefined(val);});
  }

  /*
   * If a field is null or empty, initializes it with the necessary locale
   * placeholder objects
   */
  function setupFieldLocales(contentTypeFields, field, fieldId) {
    if(!_.isObject(field) || _.isEmpty(field)){
      var newField = {};
      var fieldType = _.find(contentTypeFields, {id: fieldId});
      if(fieldType.localized){
        _.each($scope.spaceContext.space.data.locales, function (locale) {
          newField[locale.code] = null;
        });
      } else {
        newField[$scope.spaceContext.space.getDefaultLocale().code] = null;
      }
      $scope.otDoc.at(['fields', fieldId]).set(newField);
    }
  }

}]);
