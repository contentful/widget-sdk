'use strict';

angular.module('contentful')
.factory('widgets/API', ['$injector', function ($injector) {
  var Channel = $injector.get('widgets/channel');
  var TheLocaleStore = $injector.get('TheLocaleStore');
  var createIDMap = $injector.get('widgets/IDMap');

  function API (space, fields, entryData, current, iframe) {
    this.channel = new Channel(iframe);
    this.channel.handlers = createHandlers(space, iframe);
    this.idMap = createIDMap(fields);
    this.current = current;
    this.fields = fields;
    this.entryData = entryData;
  }

  API.prototype.connect = function () {
    this.channel.connect(buildContext(
      this.idMap, this.current.field, this.current.locale, this.fields, this.entryData
    ));

  };

  API.prototype.destroy = function () {
    this.channel.destroy();
  };

  API.prototype.send = function () {
    this.channel.send.apply(this.channel, arguments);
  };

  API.prototype.sendFieldValueChange = function (fieldId, internalLocaleCode, value) {
    var apiName = this.idMap.field.toPublic[fieldId];
    var locale = this.idMap.locale.toPublic[internalLocaleCode];
    this.channel.send('valueChanged', [apiName, locale, value]);
  };

  API.prototype.registerHandler = function (name, fn) {
    this.channel.handlers[name] = fn;
  };

  /**
   * Return an array that represents the path for the internal ShareJS
   * document.
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
   * @param {API.ContentType.Field[]} fields
   * The list of fields of the entry’s content type
   *
   * @param {API.Entry} entryData
   * The raw data for the entry.
   */
  function buildContext (idMap, field, locale, fields, entryData) {
    var apiName = field.apiName;
    var fieldValue = dotty.get(entryData, ['fields', field.id, locale.internal_code]);
    var fieldInfo = buildFieldInfo(idMap, entryData, fields);
    return {
      field: {
        id: apiName,
        locale: locale.code,
        value: fieldValue
      },
      fieldInfo: fieldInfo,
      locales: {
        available: _.pluck(TheLocaleStore.getPrivateLocales(), 'code'),
        default: TheLocaleStore.getDefaultLocale().code
      },
      entry: entryData
    };
  }

  function buildFieldInfo (idMap, entryData, fields) {
    return _.map(fields, function (field) {
      var locales = field.localized ?
                      TheLocaleStore.getPrivateLocales()
                    : [TheLocaleStore.getDefaultLocale()];
      var values = entryData.fields[field.id];
      return {
        id: field.apiName,
        localized: field.localized,
        locales: _.pluck(locales, 'code'),
        values: idMap.locale.valuesToPublic(values)
      };
    });
  }

  function createHandlers (space, iframe) {
    return {
      setHeight: function (height) {
        iframe.setAttribute('height', height);
      }
    };
  }

}]);
