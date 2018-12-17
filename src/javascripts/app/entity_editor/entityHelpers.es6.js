import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';

/**
 * TODO This module is basically an adapter for the entity helper methods on
 * `spaceContext` with logic split across the two modules. This makes this
 * module also stateful, i.e. it depends on the set space.
 *
 * We should collect all entity helper logic in one point and create that
 * object where it is needed.
 */
registerFactory('EntityHelpers', [
  '$q',
  'spaceContext',
  '$filter',
  ($q, spaceContext, $filter) => {
    const assetUrlFilter = $filter('assetUrl');

    return {
      newForLocale: newForLocale,
      contentTypeFieldLinkCtIds: contentTypeFieldLinkCtIds
    };

    function newForLocale(locale) {
      return {
        /**
         * Returns a string representing the entity's title in a given locale.
         * Asset: Title field.
         * Entry: Value of the field serving as title according to the entry's
         *        content type.
         *
         * @param {object} entity
         * @param {string} locale
         * @return {string|null}
         */
        entityTitle: spaceContextDelegator('entityTitle', locale),
        /**
         * Returns a string representing the entity's description.
         * Asset: Description field.
         * Entry: Value of the first Symbol or Text type field that
         *        is not the title field.
         *
         * TODO: Consider `RichText` type fields as description.
         *
         * @param {object} entity
         * @param {string} locale
         * @return {string}
         */
        entityDescription: spaceContextDelegator('entityDescription', locale),
        /**
         * Returns an object representing the main file associated with the entity.
         * Asset: The asset's file if it has one or `null`.
         * Entry: The image file of an asset of the first asset Link type field or
         *        `null` if the asset has no file or if it's not an image.
         *
         * @param {object} entity
         * @param {string} locale
         * @return {object|null}
         */
        entityFile: entity => entityFile(entity, locale),
        entryImage: spaceContextDelegator('entryImage', locale),
        assetFile: asset => assetFile(asset, locale),
        assetFileUrl: assetFileUrl
      };
    }

    /**
     * Create a function that delegates to given space context method
     * with the given locale code.
     *
     * The argument of the returned function is external entity data.
     * This data is transformed into an entity for the space context
     * method to work.
     */
    function spaceContextDelegator(methodName, localeCode) {
      return data =>
        dataToEntity(data).then(entity => spaceContext[methodName](entity, localeCode));
    }

    /**
     * Accepts entity payload with public field ids and returns an object
     * that mocks the @contentful/client library interface of the entity.
     * In particular it uses private ids.
     */
    function dataToEntity(data) {
      let prepareFields = $q.resolve(data.fields);
      const ctId = _.get(data, 'sys.contentType.sys.id');

      if (data.sys.type === 'Entry') {
        prepareFields = spaceContext.publishedCTs.fetch(ctId).then(ct => {
          if (ct) {
            return _.transform(
              ct.data.fields,
              (acc, ctField) => {
                const field = _.get(data, ['fields', ctField.apiName]);
                if (field) {
                  acc[ctField.id] = field;
                }
              },
              {}
            );
          } else {
            return data.fields;
          }
        });
      }

      return prepareFields.then(fields => ({
        data: { fields: fields, sys: data.sys },
        getType: _.constant(data.sys.type),
        getContentTypeId: _.constant(ctId)
      }));
    }

    function entityFile(entity, locale) {
      if (entity.sys.type === 'Entry') {
        return newForLocale(locale).entryImage(entity);
      } else if (entity.sys.type === 'Asset') {
        return assetFile(entity, locale);
      }
      return $q.resolve(null);
    }

    function assetFile(data, locale) {
      return $q.resolve(spaceContext.getFieldValue({ data: data }, 'file', locale));
    }

    function assetFileUrl(file) {
      if (_.isObject(file) && file.url) {
        return $q.resolve(assetUrlFilter(file.url));
      } else {
        return $q.reject();
      }
    }

    /**
     * Returns a list of content type IDs if a given content type field has a
     * validation restricting the allowed references to a set of content types.
     * Returns an empty array if there is no such restriction for the field.
     *
     * TODO: Make this work with `RichText` fields.
     *
     * @param {object} field
     * @returns {Array<string>}
     */
    function contentTypeFieldLinkCtIds(field) {
      if (!_.isObject(field)) {
        throw new Error('expects a content type field');
      }
      const validations = (field.type === 'Array' ? field.items : field).validations;

      const contentTypeValidation = _.find(validations, validation => !!validation.linkContentType);

      return contentTypeValidation ? contentTypeValidation.linkContentType : [];
    }
  }
]);
