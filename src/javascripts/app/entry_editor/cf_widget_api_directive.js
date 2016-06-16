'use strict';

/**
 * @ngdoc directive
 * @name cfWidgetApi
 *
 * @description
 * Provides an interface similar to the new widget api.
 *
 * @scope.requires {object} entry
 * @scope.requires {object} locale
 * @scope.requires {object} otSubDoc
 * @scope.requires {object} fields
 * @scope.requires {object} transformedContentTypeData
 * @scope.requires {object} widget
 * @scope.requires {object} fieldController
 */
angular.module('contentful')
.directive('cfWidgetApi', [function () {
  return {
    restrict: 'A',
    controller: 'WidgetApiController'
  };
}])

/**
 * @ngdoc type
 * @name WidgetApiController
 * @description
 * Interface for a widget to communicate with an entry.
 *
 * Exposed by the `cfWidgetApi` directive.
 */
.controller('WidgetApiController', ['$scope', '$injector', function ($scope, $injector) {

  var newSignal = $injector.get('signal').createMemoized;
  var TheLocaleStore = $injector.get('TheLocaleStore');

  var fieldLocaleDoc = $scope.otSubDoc;
  var isDisabledSignal = newSignal(isEditingDisabled());
  var schemaErrorsSignal = newSignal(null);
  var ctField = $scope.widget.field;

  $scope.$watch(isEditingDisabled, function (value) {
    // Do not send other listener arguments to signal
    isDisabledSignal.dispatch(value);
  });

  $scope.$watch('fieldLocale.errors', function (errors) {
    schemaErrorsSignal.dispatch(errors);
  });

  // TODO: consolidate entity data at one place instead of
  // splitting it across a sharejs doc as well as global
  // entity data
  var sysChangedSignal = newSignal($scope.entity.data.sys);
  $scope.$watch('entity.data.sys', function (sys) {
    sysChangedSignal.dispatch(sys);
  });

  this.settings = $scope.widget.settings;
  this.settings.helpText = this.settings.helpText || $scope.widget.defaultHelpText;

  this.locales = {
    default: getDefaultLocaleCode(),
    available: getAvailableLocaleCodes()
  };

  this.contentType = $scope.transformedContentTypeData;

  this.entry = {
    getSys: function () {
      return $scope.entity.data.sys;
    },
    onSysChanged: sysChangedSignal.attach,
    fields: $scope.fields // comes from entry editor controller
  };

  this.space = $injector.get('WidgetApiController/space');

  this.field = {
    onDisabledStatusChanged: isDisabledSignal.attach,
    onSchemaErrorsChanged: schemaErrorsSignal.attach,
    setInvalid: setInvalid,

    onValueChanged: fieldLocaleDoc.onValueChanged,
    getValue: fieldLocaleDoc.get,
    setValue: fieldLocaleDoc.set,
    setString: fieldLocaleDoc.setString,
    removeValue: fieldLocaleDoc.remove,
    removeValueAt: fieldLocaleDoc.removeAt,
    insertValue: fieldLocaleDoc.insert,
    pushValue: fieldLocaleDoc.push,

    id: ctField.apiName, // we only want to expose the public ID
    locale: $scope.locale.code,
    type: ctField.type,
    linkType: ctField.linkType,
    itemLinkType: dotty.get(ctField, ['items', 'linkType']),
    required: !!ctField.required,
    validations: ctField.validations || [],
    itemValidations: dotty.get(ctField, ['items', 'validations'], [])
  };

  /**
   * @ngdoc method
   * @name WidgetApiController#field.setInvalid
   * @description
   * Set to true to indicate that the user input is invalid.
   *
   * If true this will set the field state to invalid and show a red side
   * border.
   *
   * @param {boolean} isInvalid
   */
  function setInvalid (isInvalid) {
    $scope.fieldController.setInvalid($scope.locale.code, isInvalid);
  };

  function isEditingDisabled () {
    return $scope.fieldLocale.access.disabled;
  }

  function getDefaultLocaleCode () {
    return TheLocaleStore.getDefaultLocale().code;
  }

  function getAvailableLocaleCodes () {
    return _.map(TheLocaleStore.getPrivateLocales(), 'code');
  }
}])

.factory('WidgetApiController/space', ['$injector', function ($injector) {

  var $q = $injector.get('$q');
  var $state = $injector.get('$state');
  var $controller = $injector.get('$controller');
  var spaceContext = $injector.get('spaceContext');
  var assetUrlFilter = $injector.get('$filter')('assetUrl');
  var entityStatusController = $controller('EntityStatusController');

  return _.extend({}, spaceContext.cma, {
    entityStatus: entityStatus,
    entityTitle: wrap('entityTitle'),
    entityDescription: wrap('entityDescription'),
    entryImage: wrap('entryImage'),
    assetFile: assetFile,
    assetUrl: assetUrl,
    goToEditor: goToEditor
  });

  function entityStatus (data) {
    var isPublished = !!data.sys.publishedVersion;
    return $q.resolve(entityStatusController.getClassname({
      isPublished: _.constant(isPublished),
      hasUnpublishedChanges: _.constant(!isPublished || data.sys.version > data.sys.publishedVersion + 1),
      isArchived: _.constant(!!data.sys.archivedVersion)
    }));
  }

  function wrap (method) {
    return function (data, localeCode) {
      return dataToEntity(data).then(function (entity) {
        return spaceContext[method](entity, localeCode);
      });
    };
  }

  function dataToEntity (data) {
    var prepareFields = $q.resolve(data.fields);
    var ctId = dotty.get(data, 'sys.contentType.sys.id');

    if (data.sys.type === 'Entry') {
      prepareFields = spaceContext
      .fetchPublishedContentType(ctId)
      .then(function (ct) {
        return _.transform(ct.data.fields, function (acc, field) {
          acc[field.id] = data.fields[field.apiName];
        }, {});
      });
    }

    return prepareFields.then(function (fields) {
      return {
        data: {fields: fields, sys: data.sys},
        getType: _.constant(data.sys.type),
        getContentTypeId: _.constant(ctId)
      };
    });
  }

  function assetFile (data, locale) {
    return $q.resolve(dotty.get(data, 'fields.file.' + locale, null));
  }

  function assetUrl (url) {
    return $q.resolve(assetUrlFilter(url));
  }

  function goToEditor (link) {
    var pluralsByType = {Entry: 'entries', Asset: 'assets'};
    var typePlural = pluralsByType[link.sys.linkType];
    var path = 'spaces.detail.' + typePlural + '.detail';

    var options = {addToContext: true};
    var entityIdKey = link.sys.linkType.toLowerCase() + 'Id'; // entryId, assetId
    options[entityIdKey] = link.sys.id;

    return $state.go(path, options);
  }
}]);
