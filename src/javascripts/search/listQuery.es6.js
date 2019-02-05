import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import { assetContentType } from 'legacy-client';
import * as SystemFields from 'data/SystemFields.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name ListQuery
   * @description
   * Various helpers for preparing API queries.
   */

  registerFactory('ListQuery', [
    '$q',
    'spaceContext',
    'app/ContentList/Search/QueryBuilder.es6',
    ($q, spaceContext, { buildQuery: buildQueryFromUISearch }) => {
      const DEFAULT_ORDER = SystemFields.getDefaultOrder();

      return {
        /**
         * @ngdoc method
         * @name ListQuery#getForEntries
         * @description
         * Prepares an API query for the entry list.
         *
         * @param {string} opts.contentTypeId
         * @param {string} opts.searchText
         * @param {object} opts.order
         * @param {Paginator} opts.paginator
         * @returns {object}
         */
        getForEntries: function(opts) {
          if (opts.contentTypeId) {
            return spaceContext.publishedCTs
              .fetch(opts.contentTypeId)
              .then(contentType => prepareEntityListQuery(contentType, opts));
          } else {
            return prepareEntityListQuery(null, opts);
          }
        },
        /**
         * @ngdoc method
         * @name ListQuery#getForAssets
         * @description
         * Prepares an API query for the asset list.
         *
         * @param {string} opts.searchText
         * @param {object} opts.order
         * @param {Paginator} opts.paginator
         * @returns {object}
         */
        getForAssets: function(opts) {
          return prepareEntityListQuery(assetContentType, opts);
        },
        /**
         * @ngdoc method
         * @name ListQuery#getForUsers
         * @description
         * Prepares an API query for the user list.
         *
         * @param {Paginator} opts.paginator
         * @returns {object}
         */
        getForUsers: function(opts) {
          const userContentType = {
            data: {},
            getId: _.constant(undefined)
          };
          return prepareEntityListQuery(userContentType, opts);
        }
      };

      function prepareEntityListQuery(contentType, opts) {
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
        order = prepareOrderObject(order);
        const prefix = order.direction === 'descending' ? '-' : '';

        return prefix + getOrderPath(order, contentType).join('.');
      }

      function prepareOrderObject(order) {
        order = _.clone(order) || {};
        order.fieldId = order.fieldId || DEFAULT_ORDER.fieldId;
        order.direction = order.direction || DEFAULT_ORDER.direction;

        return order;
      }

      // handling stored list order w/o distinction
      // between sys.% and fields.% paths
      function getOrderPath(order, contentType) {
        // check system fields first:
        if (isSystemField(order.fieldId)) {
          return ['sys', order.fieldId];
        }

        // and CT fields afterwards:
        const ctField = getCtField(order.fieldId, contentType);
        if (ctField) {
          return ['fields', ctField.apiName || ctField.id];
        }

        return ['sys', DEFAULT_ORDER.fieldId];
      }

      function isSystemField(id) {
        return !!_.find(SystemFields.getList(), { id: id });
      }

      function getCtField(id, ct) {
        const ctFields = _.get(ct, 'data.fields', []);
        return _.find(ctFields, { id: id });
      }
    }
  ]);
}
