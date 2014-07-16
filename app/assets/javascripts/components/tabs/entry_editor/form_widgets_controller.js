'use strict';
angular.module('contentful').controller('FormWidgetsController', ['$scope', '$injector', function FormFieldsController($scope, $injector){
  var sentry = $injector.get('sentry');
  $scope.$watch(function (scope) {
    return _.pluck(scope.spaceContext.activeLocales, 'code');
  }, updateFields, true);
  $scope.$watch('spaceContext.space.getDefaultLocale()', updateFields);
  $scope.$watch('preferences.showDisabledFields', updateFields);
  $scope.$watch(function () { return $scope.errorPaths; }, updateFields);
  $scope.$watch('spaceContext.publishedTypeForEntry(entry).data.fields', updateFields, true);

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
      return !field.disabled || scope.preferences.showDisabledFields || $scope.errorPaths[field.id];
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
      return _.map($scope.errorPaths[field.id], function (code) {
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

  
}]);
