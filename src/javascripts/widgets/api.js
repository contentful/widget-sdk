'use strict';

angular.module('contentful')

/**
 * @ngdoc type
 * @name widgets/API
 * @description
 * Exposes constructor for the `API` class that is used to communicate
 * with widgets in iframes.
 */
.factory('widgets/API', ['require', function (require) {
  var Channel = require('widgets/channel');
  var TheLocaleStore = require('TheLocaleStore');
  var createIDMap = require('widgets/IDMap');
  var $q = require('$q');
  var entitySelector = require('entitySelector');

  /**
   * @ngdoc method
   * @name widgets/API#API
   *
   * @param {Client.Space} apiClient
   * @param {object} spaceMembership
   * @param {Array<API.ContentType.Field>} fields
   * @param {API.Entry} entryData
   * @param {API.ContentType.Data} contentTypeData
   * @param {API.ContentType.Field} current.field
   *   The field the widget is attached to.
   * @param {API.Locale} current.locale
   *   The locale the widget is attached to.
   * @param {IFrame} iframe
   */
  function API (apiClient, spaceMembership, fields, entryData, contentTypeData, current, iframe) {
    this.channel = new Channel(iframe);
    this.idMap = createIDMap(fields);
    this.current = current;
    this.fields = fields;
    this.entryData = entryData;
    this.contentTypeData = contentTypeData;
    this.spaceMembership = spaceMembership;
    this.channel.handlers = createHandlers(apiClient, iframe);
  }

  /**
   * @ngdoc method
   * @name widgets/API#connect
   * @description
   * Sends initial data to the widget iframe.
   *
   * This includes the current field and locale, the entry data, and
   * information about other fields and available locales.
   */
  API.prototype.connect = function () {
    this.channel.connect(buildContext(
      this.idMap, this.current.field, this.current.locale, this.current.isDisabled,
      this.fields, this.entryData, this.contentTypeData, this.spaceMembership
    ));
  };

  /**
   * @ngdoc method
   * @name widgets/API#destroy
   * @description
   * Removes all message event listeners
   */
  API.prototype.destroy = function () {
    this.channel.destroy();
  };

  /**
   * @ngdoc method
   * @name widgets/API#send
   * @param {string} method
   * @param {Array<any>} params
   */
  API.prototype.send = function () {
    this.channel.send.apply(this.channel, arguments);
  };

  /**
   * @ngdoc method
   * @name widgets/API#sendFieldValueChange
   * @description
   * Translates the internal IDs to public ones and sends a
   * `valueChanged` message to the widget.
   *
   * @param {string} fieldId
   * @param {string} internalLocaleCode
   * @param {any} value
   */
  API.prototype.sendFieldValueChange = function (fieldId, internalLocaleCode, value) {
    var apiName = this.idMap.field.toPublic[fieldId];
    var locale = this.idMap.locale.toPublic[internalLocaleCode];
    this.channel.send('valueChanged', [apiName, locale, value]);
  };

  /**
   * @ngdoc method
   * @name widgets/API#registerHanlder
   * @description
   * Registers a function to be called when a message is received by
   * the connected iframe.
   *
   * @param {string} name
   * @param {function} fn
   */
  API.prototype.registerHandler = function (name, fn) {
    this.channel.handlers[name] = fn;
  };

  /**
   * @ngdoc method
   * @name widgets/API#buildDocPath
   * @description
   * Return an array that represents the path for the internal ShareJS
   * document.
   *
   * It translates public field ids (the `apiName`) to internal ids and
   * public locale codes to internal ones.
   *
   * @usage[js]
   * api.buildDocPath('title', 'en_US')
   * // ['fields', 'fg3sigk', 'en_US_2']
   */
  API.prototype.buildDocPath = function (apiName, localeCode) {
    var internalID = this.idMap.field.toInternal[apiName];
    var internalLocaleCode = this.idMap.locale.toInternal[localeCode];
    return ['fields', internalID, internalLocaleCode];
  };

  return API;


  /**
   * Create an object that we send to the widget to set up the API.
   *
   * The object contains information about
   * - the field and locale the widget is attached to
   * - All available fields on entry
   * - The available locales and the defaullt locale
   * - The entry data and metadata
   *
   * @param {Widgets.IDMap} idMap
   * Maps between public and internal IDs * for fields and locales.
   *
   * @param {API.ContentType.Field} field
   * The field the widget is attached to.
   *
   * @param {API.Locale} locale
   * The locale the widget is attached to.
   *
   * @param {Boolean} isDisabled
   * Flag that indicates if field is disabled
   *
   * @param {API.ContentType.Field[]} fields
   * The list of fields of the entry’s content type
   *
   * @param {API.Entry} entryData
   * The raw data for the entry.
   *
   * @param {API.ContentType.Data} contentTypeData
   * Content type data with internal ids transformed to public ids
   * and displayField property added.
   *
   * @param {object} spaceMembership
   */
  function buildContext (idMap, field, locale, isDisabled, fields, entryData, contentTypeData, spaceMembership) {
    var apiName = field.apiName;
    var fieldValue = _.get(entryData, ['fields', field.id, locale.internal_code]);
    var fieldInfo = buildFieldInfo(idMap, entryData, fields);
    return {
      user: buildUser(spaceMembership),
      field: {
        id: apiName,
        locale: locale.code,
        value: fieldValue,
        isDisabled: isDisabled,
        type: field.type,
        validations: field.validations
      },
      fieldInfo: fieldInfo,
      locales: {
        available: _.map(TheLocaleStore.getPrivateLocales(), 'code'),
        default: TheLocaleStore.getDefaultLocale().code
      },
      entry: entryData,
      contentType: contentTypeData
    };
  }

  function buildFieldInfo (idMap, entryData, fields) {
    return _.map(fields, function (field) {
      var locales = field.localized
        ? TheLocaleStore.getPrivateLocales()
        : [TheLocaleStore.getDefaultLocale()];
      var values = entryData.fields[field.id];
      return {
        id: field.apiName,
        localized: field.localized,
        locales: _.map(locales, 'code'),
        values: idMap.locale.valuesToPublic(values)
      };
    });
  }

  function createHandlers (apiClient, iframe) {
    return {
      callSpaceMethod: function (methodName, args) {
        return apiClient[methodName].apply(apiClient, args)
        .catch(function (err) {
          return $q.reject({
            message: 'Request failed',
            code: err.code,
            data: err.body // Cyborg?
          });
        });
      },

      setHeight: function (height) {
        iframe.setAttribute('height', height);
      },

      openDialog: function (type, options) {
        if (type === 'entitySelector') {
          return entitySelector.openFromExtension(options);
        } else {
          return $q.reject(new Error('Unknown dialog type.'));
        }
      }
    };
  }

  function buildUser (spaceMembership) {
    var user = spaceMembership.user;
    return {
      sys: {
        id: user.sys.id
      },
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      spaceMembership: {
        sys: {
          id: spaceMembership.sys.id
        },
        admin: !!spaceMembership.admin,
        roles: spaceMembership.roles.map(function (role) {
          return {
            name: role.name,
            description: role.description
          };
        })
      }
    };
  }
}]);
