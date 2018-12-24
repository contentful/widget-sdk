import { registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import * as Kefir from 'kefir';
import * as K from 'utils/kefir.es6';
import { Operator } from 'app/ContentList/Search/Operators.es6';
import Paginator from 'classes/Paginator.es6';

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
  'overridingRequestQueue',
  'EntityHelpers',
  'app/ContentList/Search',
  'data/ContentTypeRepo/accessibleCTs.es6',
  function EntitySelectorController(
    $scope,
    $timeout,
    spaceContext,
    createQueue,
    EntityHelpers,
    { default: createSearchInput },
    { default: getAccessibleCTs }
  ) {
    const MIN_SEARCH_TRIGGERING_LEN = 1;
    const MODES = { AVAILABLE: 1, SELECTED: 2 };

    const config = $scope.config;
    const singleContentTypeId =
      config.linkedContentTypeIds && config.linkedContentTypeIds.length === 1
        ? config.linkedContentTypeIds[0]
        : null;

    initializeSearchUI();

    const load = createQueue(fetch);

    // Returns a promise for the content type of the given entry.
    // We cache this by the entry id
    const getContentType = _.memoize(
      entity => spaceContext.publishedCTs.fetch(entity.sys.contentType.sys.id),
      entity => entity.sys.id
    );

    Object.assign($scope, MODES, {
      onChange: $scope.onChange || _.noop,
      onNoEntities: $scope.onNoEntities || _.noop,
      spaceContext: spaceContext,
      view: { mode: MODES.AVAILABLE },
      paginator: Paginator.create(),
      items: [],
      selected: [],
      selectedIds: {},
      toggleSelection: toggleSelection,
      loadMore: loadMore,
      getSearchPlaceholder: getSearchPlaceholder,
      supportsAdvancedSearch: _.includes(['Entry', 'Asset'], config.entityType),
      helpers: getEntityHelpers(config),
      getContentType: getContentType
    });

    if (config.withCreate) {
      $scope.createEntityProps = {
        contentTypes: getValidContentTypes(
          config.linkedContentTypeIds,
          spaceContext.publishedCTs.getAllBare()
        ),
        onSelect: entity => {
          $scope.onChange([entity]);
        },
        type: config.entityType,
        suggestedContentTypeId: getSearch().contentTypeId
      };

      $scope.createEntityInlineProps = { ...$scope.createEntityProps, hasPlusIcon: false };
    }

    $scope.$watch('view.searchText', handleTermChange);
    $scope.$on('forceSearch', resetAndLoad);

    resetAndLoad();

    function getEntityHelpers(config) {
      if (['Entry', 'Asset'].indexOf(config.entityType) < 0) {
        return null;
      } else {
        return EntityHelpers.newForLocale(config.locale);
      }
    }

    function initializeSearchUI() {
      const withAssets = config.entityType === 'Asset';
      const initialSearchState = {};
      if (singleContentTypeId) {
        initialSearchState.contentTypeId = singleContentTypeId;
      }
      const isSearching$ = K.fromScopeValue(
        $scope,
        $scope => $scope.isLoading && !$scope.isLoadingMore
      );
      const accessibleContentTypes = getAccessibleCTs(
        spaceContext.publishedCTs,
        initialSearchState.contentTypeId
      );
      const contentTypes = getValidContentTypes(
        config.linkedContentTypeIds,
        accessibleContentTypes
      );

      createSearchInput({
        $scope: $scope,
        contentTypes: contentTypes,
        onSearchChange: onSearchChange,
        isSearching$: isSearching$,
        initState: initialSearchState,
        users$: Kefir.fromPromise(spaceContext.users.getAll()),
        withAssets: withAssets
      });
    }

    function getValidContentTypes(linkedContentTypeIds, contentTypes) {
      const acceptsOnlySpecificContentType =
        linkedContentTypeIds && linkedContentTypeIds.length > 0;

      if (acceptsOnlySpecificContentType) {
        contentTypes = contentTypes.filter(ct => linkedContentTypeIds.indexOf(ct.sys.id) > -1);
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

    function fetch() {
      $scope.isLoading = true;
      return config.fetch(getParams());
    }

    function getParams() {
      const params = {
        order: getOrder(),
        paginator: $scope.paginator,
        ...getSearch()
      };

      if (config.entityType === 'Entry' && singleContentTypeId) {
        params.contentTypeId = singleContentTypeId;
      }
      if (config.entityType === 'Asset') {
        params.searchFilters = [
          ...(params.searchFilters || []),
          ['fields.file', Operator.EXISTS, true]
        ];
      }

      return params;
    }

    function getSearch() {
      const view = $scope.view || {};
      return {
        searchText: view.searchText || '',
        searchFilters: view.searchFilters || [],
        contentTypeId: view.contentTypeId
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
      }
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

    function handleTermChange(term, prev) {
      if (isTermTriggering(term) || isClearingTerm(term, prev)) {
        resetAndLoad();
      }
    }

    function isTermTriggering(term) {
      return _.isString(term) && term.length >= MIN_SEARCH_TRIGGERING_LEN;
    }

    function isClearingTerm(term, prev) {
      return _.isString(prev) && (!_.isString(term) || term.length < prev.length);
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
        itemsById: _.groupBy($scope.items, 'sys.id')
      };

      return res.items.reduce((acc, item) => {
        const id = _.get(item, 'sys.id');
        if (id && !acc.itemsById[id] && !isAssetWithoutFile(item)) {
          return {
            items: acc.items.concat(item),
            itemsById: Object.assign(acc.itemsById, _.set({}, id, item))
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
      load().then(response => {
        $scope.items = [];
        $scope.paginator.setTotal(0);
        $scope.paginator.setPage(0);
        handleResponse(response);
      });
    }

    function loadMore() {
      // we can specify in the config that loading more is not needed
      // for example, if we fetch everything during the first call
      if (!$scope.config.noPagination && !$scope.isLoading && !$scope.paginator.isAtLast()) {
        $scope.isLoadingMore = true;
        $scope.paginator.next();
        load().then(handleResponse);
      }
    }

    function getSearchPlaceholder() {
      let placeholder = $scope.labels.searchPlaceholder;
      if (!placeholder) {
        return '';
      }
      const totalEntities = $scope.paginator.getTotal();
      placeholder = placeholder.replace(/%total%\s*/, totalEntities > 1 ? totalEntities + ' ' : '');
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
        $scope.items.length < 1 && !currentSearch.searchText && !currentSearch.searchFilters.length
      );
    }
  }
]);
