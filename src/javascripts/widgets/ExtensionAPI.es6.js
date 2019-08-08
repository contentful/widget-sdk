import { pick, get, difference } from 'lodash';
import createIDMap from './IDMap.es6';
import * as PublicContentType from './PublicContentType.es6';

const sharedFieldProps = field => ({
  id: field.apiName || field.id,
  required: !!field.required,
  ...pick(field, ['type', 'validations', 'items'])
});

const REQUIRED_CONFIG_KEYS = [
  'extensionId',
  'spaceId',
  'environmentId',
  'location', // Where the extension is rendered. See `WidgetLocations`.
  'channel', // Instance of `ExtensionIFrameChannel`
  'locales', // `{ available, default }` with all private locales and the default.
  'entryData', // API Entry entity. Using internal IDs (ShareJS format).
  'contentTypeData', // API ContentType entity. Using internal IDs (ShareJS format).
  'spaceMember', // API SpaceMember entity.
  'spaceMembership', // API SpaceMembership entity.
  'parameters', // UI Extension parameters.
  'editorInterface',

  // `{ field, locale }` for a field-locale pair of the extension being rendered.
  // `field` uses internal IDs (ShareJS format).
  // `locale` has the `internal_code` property.
  // Can be `null` if the extension is not tied to a field.
  'current'
];

/**
 * Exposes constructor for the `ExtensionAPI` class that is used to communicate
 * with UI Extensions rendered in IFrames.
 */
export default class ExtensionAPI {
  constructor(config) {
    REQUIRED_CONFIG_KEYS.forEach(key => {
      if (key in config) {
        this[key] = config[key];
      } else {
        throw new Error(`Required configuration option "${key}" missing`);
      }
    });

    const extraKeys = difference(Object.keys(config), REQUIRED_CONFIG_KEYS);
    if (extraKeys.length > 0) {
      throw new Error(`Extra configuration options ${extraKeys.join(', ')} provided`);
    }

    this.contentTypeFields = get(this.contentTypeData, ['fields'], []);
    this.idMap = createIDMap(this.contentTypeFields, this.locales.available);
  }

  getIds() {
    const {
      current,
      extensionId,
      spaceId,
      environmentId,
      contentTypeData,
      entryData,
      spaceMember
    } = this;

    return {
      extension: extensionId,
      space: spaceId,
      environment: environmentId,
      contentType: get(contentTypeData, ['sys', 'id']),
      entry: get(entryData, ['sys', 'id']),
      field: get(current, ['field', 'apiName']) || get(current, ['field', 'id']),
      user: get(spaceMember, ['sys', 'user', 'sys', 'id'])
    };
  }

  // Sends initial data to the IFrame of an extension.
  connect() {
    const {
      spaceMember,
      spaceMembership,
      current,
      entryData,
      locales,
      location,
      editorInterface,
      parameters,
      contentTypeData
    } = this;

    this.channel.connect({
      location,
      user: {
        sys: {
          type: 'User',
          id: spaceMember.sys.user.sys.id
        },
        firstName: spaceMember.sys.user.firstName,
        lastName: spaceMember.sys.user.lastName,
        email: spaceMember.sys.user.email,
        avatarUrl: spaceMember.sys.user.avatarUrl,
        // There could be a case where spaceMembership is not present
        // because the user has access to the space via a team.
        // In this case we just return null for spaceMembership
        spaceMembership: spaceMembership
          ? {
              sys: {
                type: 'SpaceMembership',
                id: spaceMember.sys.id
              },
              admin: !!spaceMember.admin,
              roles: spaceMember.roles.map(role => ({
                name: role.name,
                description: role.description
              }))
            }
          : null
      },
      field: current
        ? {
            locale: current.locale.code,
            value: get(entryData, ['fields', current.field.id, current.locale.internal_code]),
            ...sharedFieldProps(current.field)
          }
        : undefined,
      fieldInfo: this.contentTypeFields.map(field => {
        const fieldLocales = field.localized ? locales.available : [locales.default];
        const values = entryData.fields[field.id];

        return {
          localized: field.localized,
          locales: fieldLocales.map(locale => locale.code),
          values: this.idMap.locale.valuesToPublic(values),
          ...sharedFieldProps(field)
        };
      }),
      locales: {
        available: locales.available.map(locale => locale.code),
        default: locales.default.code,
        names: locales.available.reduce((acc, locale) => {
          return { ...acc, [locale.code]: locale.name };
        }, {})
      },
      // We only need `sys` in the SDK.
      // Make sure we don't leak internal field IDs:
      entry: { sys: entryData.sys },
      // Convert content type to its public form for external consumption:
      contentType: PublicContentType.fromInternal(contentTypeData),
      editorInterface,
      parameters,
      ids: this.getIds()
    });
  }

  // Registers a regular handler intended to be called directly.
  registerHandler(name, fn) {
    if (this.channel.handlers[name]) {
      throw new Error('Cannot register handler for the same event twice.');
    } else {
      this.channel.handlers[name] = fn;
    }
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
      this.contentTypeFields.forEach(field => this._updateFieldLocales(field.id, docSnapshot));
    } else if (!internalLocaleCode) {
      this._updateFieldLocales(fieldId, docSnapshot);
    } else {
      this._updateFieldLocaleValue(fieldId, internalLocaleCode, docSnapshot);
    }
  }

  _updateFieldLocales(fieldId, docSnapshot) {
    const field = this.contentTypeFields.find(field => field.id === fieldId);

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
