import { get, difference } from 'lodash';
import createIDMap from './IDMap.es6';
import * as PublicContentType from './PublicContentType.es6';

const REQUIRED_CONFIG_KEYS = [
  'channel', // Instance of `ExtensionIFrameChannel`
  'current', // `{ field, locale }` for a field-locale pair rendering an extension.
  'locales', // `{ available, default }` with all private locales and the default.
  'entryData', // API Entry entity. Using internal IDs (ShareJS format).
  'contentTypeData', // API ContentType entity. Using internal IDs (ShareJS format).
  'spaceMembership', // API SpaceMembership entity.
  'parameters' // UI Extension parameters.
];

/**
 * Exposes constructor for the `ExtensionAPI` class that is used to communicate
 * with UI Extensions rendered in IFrames.
 */
export default class ExtensionAPI {
  constructor(config) {
    REQUIRED_CONFIG_KEYS.forEach(key => {
      if (config[key]) {
        this[key] = config[key];
      } else {
        throw new Error(`Required configuration option "${key}" missing`);
      }
    });

    const extraKeys = difference(Object.keys(config), REQUIRED_CONFIG_KEYS);
    if (extraKeys.length > 0) {
      throw new Error(`Extra configuration options ${extraKeys.join(', ')} provided`);
    }

    this.fields = this.contentTypeData.fields || [];
    this.contentTypeData = PublicContentType.fromInternal(this.contentTypeData);
    this.idMap = createIDMap(this.fields, this.locales.available);
  }

  // Sends initial data to the IFrame of an extension.
  connect() {
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
        type: current.field.type,
        validations: current.field.validations
      },
      fieldInfo: (fields || []).map(field => {
        const fieldLocales = field.localized ? locales.available : [locales.default];
        const values = entryData.fields[field.id];

        return {
          id: field.apiName || field.id,
          localized: field.localized,
          locales: fieldLocales.map(locale => locale.code),
          values: this.idMap.locale.valuesToPublic(values)
        };
      }),
      locales: {
        available: locales.available.map(locale => locale.code),
        default: locales.default.code,
        names: locales.available.reduce((acc, locale) => {
          return { ...acc, [locale.code]: locale.name };
        }, {})
      },
      entry: entryData,
      contentType: this.contentTypeData,
      parameters: this.parameters
    });
  }

  // Registers a regular handler intended to be called directly.
  registerHandler(name, fn) {
    this.channel.handlers[name] = fn;
  }

  // Registers a handler that expects to receive a path.
  // Makes sure that the handler function is called with internal IDs.
  registerPathHandler(name, fn) {
    this.registerHandler(name, (apiName, localeCode, ...args) => {
      const internalId = this.idMap.field.toInternal[apiName];
      const internalLocaleCode = this.idMap.locale.toInternal[localeCode];

      return fn(['fields', internalId, internalLocaleCode], ...args);
    });
  }

  destroy() {
    this.channel.destroy();
  }

  send(...args) {
    this.channel.send(...args);
  }

  /**
   * Retrieves a changed document path and a snapshot of the document
   * at the moment of the change. The change is sent to the Extension.
   *
   * If `locale` is not given it retrieves the localization object
   * for the field and sends an update for each locale.
   *
   * Similarly, if `fieldId` is not given it sends an update for
   * every field and locale.
   */
  update(path, docSnapshot) {
    const [fieldsSegment, fieldId, internalLocaleCode] = path;

    // We need to update only if fields were modified or the whole document
    // was swapped (path length is 0 in this case).
    const shouldUpdate = fieldsSegment === 'fields' || typeof fieldsSegment === 'undefined';
    if (!shouldUpdate) {
      return;
    }

    if (!fieldId) {
      this.fields.forEach(field => this._updateFieldLocales(field.id, docSnapshot));
    } else if (!internalLocaleCode) {
      this._updateFieldLocales(fieldId, docSnapshot);
    } else {
      this._updateFieldLocaleValue(fieldId, internalLocaleCode, docSnapshot);
    }
  }

  _updateFieldLocales(fieldId, docSnapshot) {
    const field = this.fields.find(field => field.id === fieldId);

    // We might receive changes from other uses on fields that we
    // do not yet know about. We silently ignore them.
    if (!field) {
      return;
    }

    const { locales } = this;
    const fieldLocales = field.localized ? locales.available : [locales.default];

    fieldLocales.forEach(locale => {
      this._updateFieldLocaleValue(fieldId, locale.internal_code, docSnapshot);
    });
  }

  _updateFieldLocaleValue(fieldId, internalLocaleCode, docSnapshot) {
    const value = get(docSnapshot, ['fields', fieldId, internalLocaleCode]);

    const apiName = this.idMap.field.toPublic[fieldId];
    const locale = this.idMap.locale.toPublic[internalLocaleCode];

    this.channel.send('valueChanged', [apiName, locale, value]);
  }
}
