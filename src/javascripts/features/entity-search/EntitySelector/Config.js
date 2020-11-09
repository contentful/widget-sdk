import { clone, find, isObject, isString, pick } from 'lodash';
import mimetype from '@contentful/mimetype';
import { getModule } from 'core/NgRegistry';
import TheLocaleStore from 'services/localeStore';
import { ListQuery } from 'core/services/ContentQuery';

const getDefaultLocaleCode = () => TheLocaleStore.getDefaultLocale().code;

const LABELS = {
  entry_single: {
    title: 'Insert existing entry',
    input: 'Search for an entry:',
    info: 'You can insert only one entry. Click on any entry to insert it.',
    empty: 'No entries',
    searchPlaceholder: 'Search %total% entries',
  },
  entry_multiple: {
    title: 'Insert existing entries',
    input: 'Search for entries:',
    selected: 'selected entries',
    empty: 'No entries',
    insert: 'Insert selected entries',
    searchPlaceholder: 'Search %total% entries',
  },
  asset_single: {
    title: 'Insert existing asset',
    input: 'Search for a media asset:',
    info: 'You can insert only one asset. Click on any asset to insert it.',
    empty: 'No assets',
    searchPlaceholder: 'Search %total% assets',
  },
  asset_multiple: {
    title: 'Insert existing assets',
    input: 'Search for assets:',
    selected: 'selected assets',
    empty: 'No assets',
    insert: 'Insert selected assets',
    searchPlaceholder: 'Search %total% assets',
  },
  user_multiple: {
    title: 'Insert existing users',
    input: 'Select users',
    selected: 'selected users',
    empty: 'No users',
    insert: 'Insert selected users',
    searchPlaceholder: 'Search %total% users in your organization',
  },
};

/**
 * Returns labels depending on configuration.
 *
 * @param {string} config.entityType
 * @param {boolean} config.multiple
 * @returns {Object}
 */
export function getLabels({ entityType = '', multiple }) {
  const key = [entityType.toLowerCase(), multiple ? 'multiple' : 'single'].join('_');
  return clone(LABELS[key] || {});
}

/**
 * Builds a config for entitySelector.openFromField()
 *
 * TODO: Rename to `newConfigFromLinkField` and remove deprecation note.
 *
 * @deprecated This does not work for `RichText` type fields as config depends
 *  on node type in rich text (as there are validations per node type).
 *
 * @param {API.Field} field
 * @param {number?} currentSize
 */
export function newConfigFromField(field = {}, currentSize = 0) {
  const entityType = field.linkType || field.itemLinkType;
  const size = findValidation(field, 'size', {});
  // TODO: Why not always set `min: 1` by default? Does it make sense to enforce
  //  user to select as many entities as the field's "min" requires? What if e.g.
  // "min" is 4 and the user wants to insert 2 entities first, then create 2 new ones?
  const min = Math.max((size.min || 1) - currentSize, 1);
  // TODO: Consider same for max. If e.g. "max" is 4, we disable the button if the
  //  user wants to select 5 but we show no information why the button is disabled.
  const max = (size.max || +Infinity) - currentSize;

  const config = {
    entityType,
    locale: field.locale || getDefaultLocaleCode(),
    multiple: max !== min && field.type === 'Array',
    min,
    max,
    linkedContentTypeIds: findLinkValidation(field, 'linkContentType'),
    linkedMimetypeGroups: findLinkValidation(field, 'linkMimetypeGroup'),

    // @todo see comments in "prepareQueryExtension"
    // linkedFileSize: findValidation(field, 'assetFileSize', {}),
    // linkedImageDimensions: findValidation(field, 'assetImageDimensions', {})
  };
  config.fetch = makeFetch(config);
  return config;
}

/**
 * Builds a config for entitySelector.openFromWidget()
 *
 * @param {object} options
 * @returns {object} config for the entity selector.
 */
export function newConfigFromExtension(options = {}) {
  const config = {
    ...pick(options, ['multiple', 'min', 'max', 'entityType', 'withCreate']),
    locale: options.locale || getDefaultLocaleCode(),
    linkedContentTypeIds: options.contentTypes || [],
    linkedMimetypeGroups: options.mimetypeGroups || [],
  };
  config.fetch = makeFetch(config);
  return config;
}

/**
 * Creates fetch function for Entity and Asset entity types
 */
function makeFetch(config) {
  const spaceContext = getModule('spaceContext');

  if (['Entry', 'Asset'].indexOf(config.entityType) < 0) {
    throw new Error("Unsupported entity type: '" + config.entityType + "'.");
  }
  const fnName = 'get' + getEntityTypePlural(config.entityType);
  const queryMethod = 'getFor' + getEntityTypePlural(config.entityType);
  const queryExtension = prepareQueryExtension(config);

  return (params) =>
    ListQuery[queryMethod](params).then((query) => {
      return spaceContext.cma[fnName]({ ...query, ...queryExtension });
    });
}

function getEntityTypePlural(singular) {
  return {
    Asset: 'Assets',
    Entry: 'Entries',
  }[singular];
}

function findLinkValidation(field, property) {
  const found = findValidation(field, property, []);
  return isString(found) ? [found] : found;
}

function findValidation({ validations = [], itemValidations = [] }, property, defaultValue) {
  const allValidations = [...validations, ...itemValidations];
  const found = find(allValidations, (v) => isObject(v[property]) || isString(v[property]));
  return (found && found[property]) || defaultValue;
}

function prepareQueryExtension(config) {
  const extension = {};

  if (config.entityType === 'Entry') {
    const ids = config.linkedContentTypeIds;
    if (Array.isArray(ids) && ids.length > 1) {
      extension['sys.contentType.sys.id[in]'] = ids.join(',');
    }
  } else if (config.entityType === 'Asset') {
    const groups = config.linkedMimetypeGroups;
    if (Array.isArray(groups) && groups.length > 0) {
      extension['fields.file.contentType[in]'] = groups
        .reduce((cts, group) => cts.concat(mimetype.getTypesForGroup(group)), [])
        .join(',');
    }

    // @todo there are multiple BE problems that need to be solved first;
    // see these Target Process tickets:
    // - https://contentful.tpondemand.com/entity/11408
    // - https://contentful.tpondemand.com/entity/8030
    // for now we don't want to apply size constraints so behavior
    // of the reference widget doesn't change

    // applySizeConstraint('fields.file.details.size', config.linkedFileSize);
    // applySizeConstraint('fields.file.details.width', config.linkedImageDimensions.width);
    // applySizeConstraint('fields.file.details.height', config.linkedImageDimensions.height);
  }

  return extension;

  // function applySizeConstraint (path, constraint) {
  //   constraint = _.isObject(constraint) ? constraint : {};
  //   if (constraint.min) {
  //     extension[path + '[gte]'] = constraint.min;
  //   }
  //   if (constraint.max) {
  //     extension[path + '[lte]'] = constraint.max;
  //   }
  // }
}
