import { EditorialConstants } from '@contentful/editorial-primitives';
import { getSpaceContext } from 'classes/spaceContext';
import _ from 'lodash';
import * as SystemFields from 'data/SystemFields';

import { buildQuery as buildQueryFromUISearch } from './QueryBuilder';

/**
 * @description
 * Prepares an API query for the entry list.
 *
 * @param {string} opts.contentTypeId
 * @param {string} opts.searchText
 * @param {object} opts.order
 * @param {Paginator} opts.paginator
 * @returns {object}
 */
export async function getForEntries(opts) {
  const spaceContext = getSpaceContext();
  if (opts.contentTypeId) {
    return spaceContext.publishedCTs
      .fetch(opts.contentTypeId)
      .then((contentType) => prepareEntityListQuery(contentType, opts));
  } else {
    return prepareEntityListQuery(null, opts);
  }
}
/**
 * @description
 * Prepares an API query for the asset list.
 *
 * @param {string} opts.searchText
 * @param {object} opts.order
 * @param {Paginator} opts.paginator
 * @returns {object}
 */
export async function getForAssets(opts) {
  const assetContentType = { data: EditorialConstants.assetContentType };
  return prepareEntityListQuery(assetContentType, opts);
}

function prepareEntityListQuery(contentType, opts) {
  const queryObject = {
    order: getOrderQuery(opts.order, contentType),
    limit: opts.paginator.getPerPage(),
    skip: opts.paginator.getSkipParam(),
    'sys.archivedAt[exists]': 'false', // By default, don't get archived entries.
  };
  const searchQuery = buildQueryFromUISearch({
    contentType,
    search: opts,
  });
  return _.assign(queryObject, searchQuery);
}

function getOrderQuery(order, contentType) {
  const DEFAULT_ORDER = SystemFields.getDefaultOrder();

  order = prepareOrderObject(order, DEFAULT_ORDER);
  const prefix = order.direction === 'descending' ? '-' : '';

  return prefix + getOrderPath(order, contentType, DEFAULT_ORDER).join('.');
}

function prepareOrderObject(order, defaultOrder) {
  order = _.clone(order) || {};
  order.fieldId = order.fieldId || defaultOrder.fieldId;
  order.direction = order.direction || defaultOrder.direction;

  return order;
}

// handling stored list order w/o distinction
// between sys.% and fields.% paths
function getOrderPath(order, contentType, defaultOrder) {
  // check system fields first:
  if (isSystemField(order.fieldId)) {
    return ['sys', order.fieldId];
  }

  // and CT fields afterwards:
  const ctField = getCtField(order.fieldId, contentType);
  if (ctField) {
    return ['fields', ctField.apiName || ctField.id];
  }

  return ['sys', defaultOrder.fieldId];
}

function isSystemField(id) {
  return !!_.find(SystemFields.getList(), { id: id });
}

function getCtField(id, ct) {
  const ctFields = ct?.fields ?? [];
  return _.find(ctFields, { id: id });
}
