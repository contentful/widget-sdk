import { registerController } from 'core/NgRegistry';
import _ from 'lodash';
import { Operator } from 'core/services/ContentQuery';
import Paginator from 'classes/Paginator';
import * as EntityHelpers from 'app/entity_editor/entityHelpers';
import getAccessibleCTs from 'data/ContentTypeRepo/accessibleCTs';
import * as random from 'utils/Random';

export default function register() {
  /**
   * @ngdoc type
   * @name EntitySelectorController
   *
   * @scope.requires {Object} config
   * {
   *   locale: {String},
   *   multiple: {Boolean},
   *   max: {Number?}, // for multiple=true
   *   min: {Number?}, // for multiple=true
   *   entityType: {String},
   *   linkedContentTypeIds: {Array?},
   *   linkedMimetypeGroups: {Array?},
   *   fetch: {function(params): Promise<{items: {Array}, total: {Number}}>}
   * }
   * @scope.requires {object} labels
   * {
   *   title: {String},
   *   input: {String},
   *   info: {String?}, // for multiple=false
   *   infoHtml: {String?}, // for multiple=false, can be used instead of `.info`
   *   selected: {String}, // for multiple=true
   *   empty: {String},
   *   insert: {String},
   *   searchPlaceholder: {String}
   * }
   * @scope.requires {number} listHeight
   */
  registerController('EntitySelectorController', [
    '$scope',
    '$timeout',
    'spaceContext',
    function EntitySelectorController($scope, $timeout, spaceContext) {
      const MODES = { AVAILABLE: 1, SELECTED: 2 };
      const ITEMS_PER_PAGE = 40;

      const config = $scope.config;
      const singleContentTypeId =
        config.linkedContentTypeIds && config.linkedContentTypeIds.length === 1
          ? config.linkedContentTypeIds[0]
          : null;
      let lastRequestId = null;

      // Returns a promise for the content type of the given entry.
      // We cache this by the entry id
      const getContentType = _.memoize(
        (entity) => spaceContext.publishedCTs.fetch(entity.sys.contentType.sys.id),
        (entity) => entity.sys.id
      );

      $scope.entityType = config.entityType.toLowerCase();
      $scope.onUpdate = (view) => onSearchChange(view);
      $scope.initialState = getInitialState();
      $scope.getContentTypes = () => getContentTypes($scope.initialState.contentTypeId);
      $scope.users = [];
      spaceContext.users.getAll().then((users) => {
        $scope.users = users;
        $scope.$applyAsync;
      });

      Object.assign($scope, MODES, {
        onChange: $scope.onChange || _.noop,
        onNoEntities: $scope.onNoEntities || _.noop,
        spaceContext: spaceContext,
        view: { mode: MODES.AVAILABLE },
        paginator: Paginator.create(ITEMS_PER_PAGE),
        items: [],
        selected: [],
        selectedIds: {},
        toggleSelection: toggleSelection,
        loadMore: loadMore,
        getSearchPlaceholder: getSearchPlaceholder,
        supportsAdvancedSearch: _.includes(['Entry', 'Asset'], config.entityType),
        helpers: getEntityHelpers(config),
        getContentType: getContentType,
      });

      if (config.withCreate) {
        $scope.createEntityProps = {
          contentTypes: getValidContentTypes(
            config.linkedContentTypeIds,
            spaceContext.publishedCTs.getAllBare()
          ),
          onSelect: (entity) => {
            $scope.onChange([entity]);
          },
          type: config.entityType,
          suggestedContentTypeId: getSearch().contentTypeId,
        };

        $scope.createEntityInlineProps = { ...$scope.createEntityProps, hasPlusIcon: false };
      }

      $scope.$on('forceSearch', resetAndLoad);

      resetAndLoad();

      /**
       * Resolves with a result of the last call.
       */
      function fetch() {
        const requestId = random.id();
        lastRequestId = requestId;
        $scope.isLoading = true;
        return new Promise((resolve, reject) => {
          config
            .fetch(getParams())
            .then((res) => requestId === lastRequestId && resolve(res))
            .catch((err) => requestId === lastRequestId && reject(err));
        });
      }

      function getEntityHelpers(config) {
        if (['Entry', 'Asset'].indexOf(config.entityType) < 0) {
          return null;
        } else {
          return EntityHelpers.newForLocale(config.locale);
        }
      }

      function getInitialState() {
        const initialSearchState = {};
        if (singleContentTypeId) {
          initialSearchState.contentTypeId = singleContentTypeId;
        }
        return initialSearchState;
      }

      function getContentTypes(contentTypeId) {
        const accessibleContentTypes = getAccessibleCTs(spaceContext.publishedCTs, contentTypeId);
        return getValidContentTypes(config.linkedContentTypeIds, accessibleContentTypes);
      }

      function getValidContentTypes(linkedContentTypeIds, contentTypes) {
        const acceptsOnlySpecificContentType =
          linkedContentTypeIds && linkedContentTypeIds.length > 0;

        if (acceptsOnlySpecificContentType) {
          contentTypes = contentTypes.filter((ct) => linkedContentTypeIds.indexOf(ct.sys.id) > -1);
        }

        return contentTypes;
      }

      function onSearchChange(newSearchState) {
        _.assign($scope.view, newSearchState);

        if ($scope.createEntityProps) {
          $scope.createEntityProps.suggestedContentTypeId = newSearchState.contentTypeId;
        }

        resetAndLoad();
      }

      function getParams() {
        const params = {
          order: getOrder(),
          paginator: $scope.paginator,
          ...getSearch(),
        };

        if (config.entityType === 'Entry' && singleContentTypeId) {
          params.contentTypeId = singleContentTypeId;
        }
        if (config.entityType === 'Asset') {
          params.searchFilters = [
            ...(params.searchFilters || []),
            ['fields.file', Operator.EXISTS, true],
          ];
        }

        return params;
      }

      function getSearch() {
        const view = $scope.view || {};
        return {
          searchText: view.searchText || '',
          searchFilters: view.searchFilters || [],
          contentTypeId: view.contentTypeId,
        };
      }

      function getOrder() {
        const ct = singleContentTypeId && spaceContext.publishedCTs.get(singleContentTypeId);
        if (ct) {
          const displayField = _.find(ct.data.fields, { id: ct.data.displayField });
          if (displayField && displayField.type === 'Symbol' && displayField.id) {
            return { fieldId: displayField.id, direction: 'ascending' };
          }
        }
      }

      const onChange = () => $scope.onChange([...$scope.selected]);
      const toggle = {
        select: function select(entity) {
          const index = _.findIndex($scope.selected, ['sys.id', entity.sys.id]);
          $scope.selectedIds[entity.sys.id] = true;
          if (index === -1) {
            $scope.selected.push(entity);
            onChange();
          }
        },
        deselect: function deselect(entity) {
          const index = _.findIndex($scope.selected, ['sys.id', entity.sys.id]);
          delete $scope.selectedIds[entity.sys.id];
          if (index > -1) {
            $scope.selected.splice(index, 1);
            onChange();
          }
        },
      };

      // @TODO: Move toggle logic into a service and improve edge cases.
      let lastToggled;

      function toggleSelection(entity, event) {
        if (!config.multiple) {
          $scope.onChange([entity]);
        } else {
          let toggleMethod;
          if (event && event.shiftKey && lastToggled) {
            const from = $scope.items.indexOf(entity);
            const to = $scope.items.indexOf(lastToggled.entity);
            const first = Math.min(from, to);
            const last = Math.max(from, to) + 1;
            toggleMethod = lastToggled.toggleMethod;
            $scope.items.slice(first, last).forEach(toggleMethod);
            event.preventDefault();
            document.getSelection().removeAllRanges();
          } else {
            toggleMethod = $scope.selectedIds[entity.sys.id] ? toggle.deselect : toggle.select;
            toggleMethod(entity);
          }
          lastToggled = { entity: entity, toggleMethod: toggleMethod };
        }
      }

      function handleResponse(res) {
        $scope.paginator.setTotal(res.total);
        $scope.items.push(...getItemsToAdd(res));
        if (hasNoEntities()) {
          $scope.onNoEntities();
        }
        $timeout(() => {
          $scope.isLoading = false;
          $scope.isLoadingMore = false;
        });
      }

      function getItemsToAdd(res) {
        // The api could theoretically return some of the entities returned already
        // if new entities were created in the meantime.
        const acc = {
          items: [],
          itemsById: _.groupBy($scope.items, 'sys.id'),
        };

        return res.items.reduce((acc, item) => {
          const id = _.get(item, 'sys.id');
          if (id && !acc.itemsById[id] && !isAssetWithoutFile(item)) {
            return {
              items: acc.items.concat(item),
              itemsById: Object.assign(acc.itemsById, _.set({}, id, item)),
            };
          }
          return acc;
        }, acc).items;
      }

      function isAssetWithoutFile(item) {
        return _.get(item, 'sys.type') === 'Asset' && !_.get(item, 'fields.file');
      }

      function resetAndLoad() {
        $scope.isLoading = true;
        $scope.paginator.setPerPage(ITEMS_PER_PAGE);
        $scope.paginator.setPage(0);
        loadItems().then((response) => {
          $scope.items = [];
          $scope.paginator.setTotal(0);
          handleResponse(response);
        });
      }

      function loadMore() {
        // we can specify in the config that loading more is not needed
        // for example, if we fetch everything during the first call
        if (!$scope.config.noPagination && !$scope.isLoading && !$scope.paginator.isAtLast()) {
          $scope.isLoadingMore = true;
          $scope.paginator.next();
          loadItems().then(handleResponse);
        }
      }

      /**
       * Load items trying with smaller and smaller batches if "Response is too big" error occurs.
       * The current page pointer is adjusted respectively.
       */
      function loadItems({ pageSize, page } = {}) {
        const perPage = pageSize ?? $scope.paginator.getPerPage();
        const currentPage = page ?? $scope.paginator.getPage();

        if (pageSize > 0) {
          // Reduce the page size to avoid the "response is too big" error
          $scope.paginator.setPerPage(pageSize);
          // Adjust the current page to the new smaller page size
          $scope.paginator.setPage(page);
        }

        return fetch().catch((err) => {
          if (
            err.status === 400 &&
            _.get(err, 'data.message', '').startsWith('Response size too big') &&
            (!pageSize || perPage > 1)
          ) {
            const newPageSize = Math.floor(perPage / 2);
            const newPage = currentPage * 2;
            return loadItems({ pageSize: newPageSize, page: newPage });
          }

          throw err;
        });
      }

      function getSearchPlaceholder() {
        let placeholder = $scope.labels.searchPlaceholder;
        if (!placeholder) {
          return '';
        }
        const totalEntities = $scope.paginator.getTotal();
        placeholder = placeholder.replace(
          /%total%\s*/,
          totalEntities > 1 ? totalEntities + ' ' : ''
        );
        if ($scope.supportsAdvancedSearch) {
          placeholder += ', press down arrow key for help';
        }
        return placeholder;
      }

      /**
       * Returns whether there are any entities for the user to select (does NOT
       * depend on current search filter).
       * @returns {boolean}
       */
      function hasNoEntities() {
        const currentSearch = getSearch();
        return (
          $scope.items.length < 1 &&
          !currentSearch.searchText &&
          !currentSearch.searchFilters.length
        );
      }
    },
  ]);
}
