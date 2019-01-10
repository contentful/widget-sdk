import { get } from 'lodash';
import createIDMap from './IDMap.es6';

const REQUIRED_CONFIG_KEYS = [
  'channel', // Instance of `WidgetIFrameChannel`
  'current', // `{ field, locale }` for a field-locale pair rendering an extension.
  'fields', // `fields` property of the API ContentType entity. Using internal IDs.
  'locales', // `{ available, default }` with all private locales and the default.
  'entryData', // API Entry entity. Using internal IDs.
  'contentTypeData', // API ContentType entity. Using public IDs.
  'spaceMembership', // API SpaceMembership entity.
  'parameters' // UI Extension parameters.
];

/**
 * Exposes constructor for the `ExtensionAPI` class that is used to communicate
 * with UI Extensions rendered in IFrames.
 *
 * TODO: use regular ES6 class.
 */
export default function API(config) {
  REQUIRED_CONFIG_KEYS.forEach(key => {
    if (config[key]) {
      this[key] = config[key];
    } else {
      throw new Error(`Required configuration option "${key}" missing`);
    }
  });

  this.idMap = createIDMap(this.fields, this.locales.available);
}

// Sends initial data to the IFrame of an extension.
API.prototype.connect = function() {
  const { spaceMembership, current, entryData, fields, locales } = this;

  this.channel.connect({
    user: {
      sys: {
        id: spaceMembership.user.sys.id
      },
      firstName: spaceMembership.user.firstName,
      lastName: spaceMembership.user.lastName,
      email: spaceMembership.user.email,
      spaceMembership: {
        sys: {
          id: spaceMembership.sys.id
        },
        admin: !!spaceMembership.admin,
        roles: spaceMembership.roles.map(role => ({
          name: role.name,
          description: role.description
        }))
      }
    },
    field: {
      id: current.field.apiName,
      locale: current.locale.code,
      value: get(entryData, ['fields', current.field.id, current.locale.internal_code]),
      isDisabled: !!current.isDisabled,
      type: current.field.type,
      validations: current.field.validations
    },
    fieldInfo: (fields || []).map(field => {
      const fieldLocales = field.localized ? locales.available : [locales.default];
      const values = entryData.fields[field.id];

      return {
        id: field.apiName,
        localized: field.localized,
        locales: fieldLocales.map(locale => locale.code),
        values: this.idMap.locale.valuesToPublic(values)
      };
    }),
    locales: {
      available: locales.available.map(locale => locale.code),
      default: locales.default.code
    },
    entry: entryData,
    contentType: this.contentTypeData,
    parameters: this.parameters
  });
};

API.prototype.registerHandler = function(name, fn) {
  this.channel.handlers[name] = fn;
};

API.prototype.destroy = function() {
  this.channel.destroy();
};

API.prototype.send = function(...args) {
  this.channel.send(...args);
};

// Translates the internal IDs to public ones and sends a `valueChanged` message.
API.prototype.sendFieldValueChange = function(fieldId, internalLocaleCode, value) {
  const apiName = this.idMap.field.toPublic[fieldId];
  const locale = this.idMap.locale.toPublic[internalLocaleCode];
  this.channel.send('valueChanged', [apiName, locale, value]);
};

/**
 * Return an array that represents the path for the internal ShareJS
 * document.
 *
 * It translates public field IDs (the `apiName`) to internal IDs and
 * public locale codes to internal ones.
 *
 * `api.buildDocPath('title', 'en_US')` -> `['fields', 'fg3sigk', 'en_US_2']`
 */
API.prototype.buildDocPath = function(apiName, localeCode) {
  const internalID = this.idMap.field.toInternal[apiName];
  const internalLocaleCode = this.idMap.locale.toInternal[localeCode];

  return ['fields', internalID, internalLocaleCode];
};
