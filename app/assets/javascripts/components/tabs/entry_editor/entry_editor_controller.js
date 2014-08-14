'use strict';

angular.module('contentful')
  .controller('EntryEditorCtrl', ['$scope', 'validation', 'addCanMethods', 'notification', 'sentry', function EntryEditorCtrl($scope, validation, addCanMethods, notification, sentry) {
  $scope.$watch('tab.params.entry', 'entry=tab.params.entry');
  $scope.$watch(function entryEditorEnabledWatcher(scope) {
    return !scope.entry.isArchived() && scope.can('update', scope.entry.data);
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
    var locales = $scope.spaceContext.space.data.locales; // TODO: watch this, too
    $scope.entrySchema = validation.fromContentType(data, locales);
  });

  addCanMethods($scope, 'entry');

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

  $scope.$watch('entry.getPublishedVersion()', function (publishedVersion, oldVersion, scope) {
    if (publishedVersion > oldVersion) scope.validate();
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

  $scope.$watch(function (scope) {
    return _.pluck(scope.spaceContext.activeLocales, 'code');
  }, updateFields, true);
  $scope.$watch('spaceContext.space.getDefaultLocale()', updateFields);
  $scope.$watch('preferences.showDisabledFields', updateFields);
  $scope.$watch(function () { return errorPaths; }, updateFields);
  $scope.$watch('spaceContext.publishedTypeForEntry(entry).data.fields', updateFields, true);
  var errorPaths = {};

  function updateFields(n, o, scope) {
    var et = scope.spaceContext.publishedTypeForEntry(scope.entry);
    if (!et) return;
    scope.fields = _(et.data.fields).filter(fieldIsEditable).map(function (field) {
      var locales = _.union(getFieldLocales(field), getErrorLocales(field));
      locales = makeUnique(locales);
      return inherit(field, {
        locales: locales,
        widgetType: fieldWidgetType(field, et)});
    }).value();

    function fieldIsEditable(field) {
      return !field.disabled || scope.preferences.showDisabledFields || errorPaths[field.id];
    }

    function makeUnique(locales) {
      var uniqLocales = _.uniq(locales, 'code');
      if(locales.length !== uniqLocales.length){
        sentry.captureError('Locales have been duplicated', {
          data: {
            locales: locales,
            activeLocales: scope.spaceContext.activeLocales
          }
        });
      }
      return uniqLocales;
    }
    function getFieldLocales(field) {
      if (field.localized)
        return scope.spaceContext.activeLocales;
      else
        return [scope.spaceContext.space.getDefaultLocale()];
    }

    function getErrorLocales(field) {
      return _.map(errorPaths[field.id], function (code) {
        return _.find(scope.spaceContext.space.data.locales, {code: code});
      });
    }

    function inherit(source, extensions){
      var Clone = function () { };
      Clone.prototype = source;
      var clone = new Clone();
      return _.extend(clone, extensions);
    }
  }

  function getFieldValidationsOfType(field, type) {
    return _.filter(_.pluck(field.validations, type));
  }

  $scope.getFieldValidationsOfType = function () {
    return getFieldValidationsOfType.apply(null, arguments)[0];
  };

  function fieldWidgetType(field, contentType) {
    var hasValidations = getFieldValidationsOfType(field, 'in').length > 0;
    if(hasValidations) return 'dropdown';
    if (field.type === 'Symbol' ) {
      return 'textfield';
    }
    if (field.type === 'Text'   ) {
      if (contentType.data.displayField === field.id) {
        return 'textarea';
      } else {
        return 'markdownEditor';
      }
    }
    if (field.type === 'Boolean') return 'radiobuttons';
    if (field.type === 'Date'   ) return 'datetimeEditor';
    if (field.type === 'Array') {
      if (field.items.type === 'Link'  ) return 'linksEditor';
      if (field.items.type === 'Symbol') return 'listInput';
    }
    if (field.type === 'Object'  ) return 'objectEditor';
    if (field.type === 'Location') return 'locationEditor';
    if (field.type === 'Number'  ) return 'numberEditor';
    if (field.type === 'Integer' ) return 'numberEditor';
    if (field.type === 'Link'    ) return 'linkEditor';
    if (field.type === 'File'    ) return 'fileEditor';
    return null;
  }

  var firstValidate = $scope.$on('otBecameEditable', function (event) {
    var scope = event.currentScope;
    if (!_.isEmpty(scope.entry.data.fields)) scope.validate();
    firstValidate();
    firstValidate = null;
  });

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

  $scope.$watch('validationResult.errors', function (errors) {
    var et = $scope.spaceContext.publishedTypeForEntry($scope.entry);
    errorPaths = {};
    $scope.hasErrorOnFields = false;

    _.each(errors, function (error) {
      if (error.path[0] !== 'fields') return;
      var fieldId      = error.path[1];
      var field        = _.find(et.data.fields, {id: fieldId});

      if(error.path.length > 1) {
        errorPaths[fieldId] = errorPaths[fieldId] || [];
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
        errorPaths[fieldId].push.apply(errorPaths[fieldId], allCodes);
      } else {
        var localeCode = error.path[2];
        errorPaths[fieldId].push(localeCode);
      }
      errorPaths[fieldId] = _.unique(errorPaths[fieldId]);
    });
  });


  $scope.headline = function(){
    return this.spaceContext.entryTitle(this.entry);
  };

}]);
