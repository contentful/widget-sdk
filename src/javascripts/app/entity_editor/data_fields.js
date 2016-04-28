'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name EntityEditor/DataFields
 */
.factory('EntityEditor/DataFields', ['$injector', function ($injector) {
  var TheLocaleStore = $injector.get('TheLocaleStore');
  var Signal = $injector.get('signal');
  var ShareJS = $injector.get('ShareJS');

  return {
    create: buildFieldsApi
  };

  /**
   * @ngdoc method
   * @name EntityEditor/DataFields#create
   * @description
   * Builds the `entry.fields` api as described in the widget-sdk
   *
   * @param {API.Field[]} fields
   * Fields in the entry editor
   * @param {object} scope
   * Used to get entity data and otChange event
   * @param {Client.Entity} scope.entity
   * Used to get current values of fields.
   * @return {object}
   */
  function buildFieldsApi (fields, scope) {
    var otChangeSignal = Signal.create();

    // TODO The document abstraction should expose this as a signal
    scope.$on('otChange', function (_, doc, ops) {
      ops.forEach(function (op) {
        var path = op.p.slice(0, 3);
        otChangeSignal.dispatch(path, ShareJS.peek(doc, path));
      });
    });

    return _.transform(fields, function (fieldsApi, field) {
      var internalId = field.id;
      var publicId = field.apiName || internalId;

      fieldsApi[publicId] = createField(internalId, otChangeSignal, scope.entity);
    }, {});
  }

  function createField (id, otChange, entity) {
    return {
      getValue: getValue,
      onValueChanged: onValueChanged,
    };

    function getValue (locale) {
      locale = getInternalLocaleCode(locale);
      return dotty.get(entity, ['data', 'fields', id, locale]);
    }

    function onValueChanged (locale, cb) {
      if (!cb) {
        cb = locale;
        locale = getDefaultLocaleCode();
      }
      locale = getInternalLocaleCode(locale);
      var offLocaleValueChanged = otChange.attach(function (path, value) {
        if (_.isEqual(path, ['fields', id, locale])) {
          cb(value);
        }
      });
      return offLocaleValueChanged;
    }
  }

  function getDefaultLocaleCode () {
    return TheLocaleStore.getDefaultLocale().code;
  }

  function getInternalLocaleCode (publicCode) {
    publicCode = publicCode || getDefaultLocaleCode();
    var internalLocaleCode = TheLocaleStore.toInternalCode(publicCode);
    if (internalLocaleCode) {
      return internalLocaleCode;
    } else {
      throw new Error('Unknown locale "' + publicCode + '"');
    }
  }
}]);
