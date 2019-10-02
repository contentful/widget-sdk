import { getModule } from 'NgRegistry.es6';
import _ from 'lodash';
import { assetContentType } from 'libs/legacy_client/client';
import * as SystemFields from 'data/SystemFields.es6';

import { buildQuery as buildQueryFromUISearch } from 'app/ContentList/Search/QueryBuilder.es6';

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
export function getForEntries(opts) {
  const spaceContext = getModule('spaceContext');
  if (opts.contentTypeId) {
    return spaceContext.publishedCTs
      .fetch(opts.contentTypeId)
      .then(contentType => prepareEntityListQuery(contentType, opts));
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
export function getForAssets(opts) {
  return prepareEntityListQuery(assetContentType, opts);
}
/**
 * @description
 * Prepares an API query for the user list.
 *
 * @param {Paginator} opts.paginator
 * @returns {object}
 */
export function getForUsers(opts) {
  const userContentType = {
    data: {},
    getId: _.constant(undefined)
  };
  return prepareEntityListQuery(userContentType, opts);
}

function prepareEntityListQuery(contentType, opts) {
  const $q = getModule('$q');
  const queryObject = {
    order: getOrderQuery(opts.order, contentType),
    limit: opts.paginator.getPerPage(),
    skip: opts.paginator.getSkipParam(),
    'sys.archivedAt[exists]': 'false' // By default, don't get archived entries.
  };
  const searchQuery = buildQueryFromUISearch({
    contentType: _.get(contentType, 'data'),
    search: opts
  });
  // TODO: Lets not return a promise here.
  return $q.resolve(_.assign(queryObject, searchQuery));
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
  const ctFields = _.get(ct, 'data.fields', []);
  return _.find(ctFields, { id: id });
}
