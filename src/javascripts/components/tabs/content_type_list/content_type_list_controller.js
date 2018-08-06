'use strict';

angular.module('contentful').controller('ContentTypeListController', ['$scope', 'require', ($scope, require) => {
  const notification = require('notification');
  const spaceContext = require('spaceContext');
  const accessChecker = require('access_control/AccessChecker');
  const Analytics = require('analytics/Analytics');
  const ctHelpers = require('data/ContentTypes');
  const createViewPersistor = require('data/ListViewPersistor').default;
  const $state = require('$state');
  const debounce = require('lodash').debounce;
  const createResourceService = require('services/ResourceService').default;
  const ResourceUtils = require('utils/ResourceUtils');

  const viewPersistor = createViewPersistor(
    spaceContext.getId(), null, 'contentTypes');

  viewPersistor.read().then(loadView);

  $scope.empty = true;

  $scope.shouldHide = accessChecker.shouldHide;
  $scope.shouldDisable = accessChecker.shouldDisable;

  const spaceId = spaceContext.space.data.sys.id;
  const resources = createResourceService(spaceId);

  const trackButtonClick = debounce(() => {
    // Track the new CT button click, with usage
    return resources.get('record').then(recordResource => {
      Analytics.track('entity_button:click', {
        entityType: 'contentType',
        usage: recordResource.usage,
        limit: ResourceUtils.getResourceLimits(recordResource).maximum
      });
    });
  });

  $scope.newContentType = () => {
    trackButtonClick();

    // X.list -> X.new
    $state.go('^.new');
  };

  $scope.$watchGroup(['context.list', 'context.searchTerm'], args => {
    if (args[0] || args[1]) {
      viewPersistor.save({list: args[0], searchTerm: args[1]});
      updateList();
    }
  });

  function loadView (view) {
    $scope.context.list = view.list || 'all';
    $scope.context.searchTerm = view.searchText || '';
  }

  function updateList () {
    $scope.context.isSearching = true;

    spaceContext.endpoint({
      method: 'GET',
      path: ['content_types'],
      query: {order: 'name', limit: 1000}
    })
      .then(res => {
        const contentTypes = res.items;

        // Some legacy content types do not have a name. If it is
        // missing we set it to 'Untitled' so we can display
        // something in the UI. Note that the API requires new
        // Content Types to have a name.
        _.forEach(contentTypes, ct => {
          ctHelpers.assureName(ct);
        });

        contentTypes.sort((a, b) => (a.name || '').localeCompare(b.name));

        const sectionVisibility = accessChecker.getSectionVisibility();

        $scope.context.forbidden = !sectionVisibility.contentType;
        $scope.context.ready = true;
        $scope.empty = contentTypes.length === 0;
        $scope.visibleContentTypes = contentTypes.filter(isOnSelectedList).filter(matchesSearchTerm);
      }, accessChecker.wasForbidden($scope.context))
      .then(res => {
        $scope.context.isSearching = false;
        return res;
      })
      .catch(err => {
        if (_.isObject(err) && 'statusCode' in err && err.statusCode === -1) {
          $scope.context.isSearching = true;
        }
      });
  }

  function isOnSelectedList (ct) {
    switch ($scope.context.list) {
      case 'changed': return isPublishedAndUpdated(ct);
      case 'active': return isPublished(ct);
      case 'draft': return isNotPublished(ct);
      default: return true;
    }
  }

  function matchesSearchTerm (contentType) {
    let searchTermRe;

    try {
      if ($scope.hasQuery()) {
        searchTermRe = new RegExp($scope.context.searchTerm.toLowerCase(), 'gi');
      }
    } catch (exp) {
      notification.warn('Invalid search term');
    }

    return searchTermRe ? searchTermRe.test(contentType.name) : true;
  }

  $scope.numFields = contentType => _.size(contentType.fields);

  $scope.hasQuery = () => _.isString($scope.context.searchTerm) && $scope.context.searchTerm.length > 0;

  $scope.statusClass = contentType => getStatus(contentType, 'class');

  $scope.statusLabel = contentType => getStatus(contentType, 'label');

  $scope.hasContentTypes = () => !$scope.empty || $scope.hasQuery();

  $scope.hasQueryResults = () => !_.isEmpty($scope.visibleContentTypes);

  function getStatus (ct, statusType) {
    const status = {
      'class': 'entity-status--published',
      label: 'active'
    };

    if (isPublishedAndUpdated(ct)) {
      return 'updated';
    } else if (isPublished(ct)) {
      return status[statusType];
    } else {
      return 'draft';
    }
  }

  // TODO extract the following methods
  function isPublished (entity) {
    return !!entity.sys.publishedVersion;
  }

  function isNotPublished (entity) {
    return !isPublished(entity);
  }

  function isPublishedAndUpdated (entity) {
    return isPublished(entity) && entity.sys.version > entity.sys.publishedVersion + 1;
  }
}]);
