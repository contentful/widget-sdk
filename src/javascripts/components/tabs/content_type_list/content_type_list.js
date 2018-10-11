'use strict';

// TODO: this view is relatively small and fully self-contained.
// Ideal candidate for migration to React.
angular
  .module('contentful')
  .directive('cfContentTypeList', () => ({
    template: JST.content_type_list(),
    restrict: 'A',
    controller: 'ContentTypeListController'
  }))
  .controller('ContentTypeListController', [
    '$scope',
    'require',
    ($scope, require) => {
      const spaceContext = require('spaceContext');
      const accessChecker = require('access_control/AccessChecker');
      const createViewPersistor = require('data/ListViewPersistor.es6').default;
      const $state = require('$state');

      const isNonEmptyString = s => typeof s === 'string' && s.length > 0;
      const normalizeName = s =>
        (s || '')
          .trim()
          .toLowerCase()
          .replace(/ +/g, ' ');

      const viewPersistor = createViewPersistor(spaceContext.getId(), null, 'contentTypes');

      viewPersistor
        .read()
        .then(view => {
          $scope.context.list = view.list || 'all';
          $scope.context.searchTerm = view.searchText || '';
        })
        .then(initContentTypes);

      $scope.contentTypes = [];
      $scope.visibleContentTypes = [];

      $scope.numFields = ct => (ct.fields || []).length;
      $scope.statusClass = ct => 'entity-status--' + getStatusLabel(ct);
      $scope.statusLabel = ct => {
        const label = getStatusLabel(ct);
        // Historically we call published content types "active".
        return label === 'published' ? 'active' : label;
      };

      $scope.shouldHide = accessChecker.shouldHide;
      $scope.shouldDisable = accessChecker.shouldDisable;

      $scope.newContentType = () => {
        // X.list -> X.new
        $state.go('^.new');
      };

      $scope.$watch('context.list', onViewChange);
      $scope.$watch('context.searchTerm', onViewChange);

      function initContentTypes() {
        spaceContext
          .endpoint({
            method: 'GET',
            path: ['content_types'],
            query: { order: 'name', limit: 1000 }
          })
          .then(res => {
            $scope.contentTypes = res.items
              .map(ct => (isNonEmptyString(ct.name) ? ct : { ...ct, name: 'Untitled' }))
              .sort((ct1, ct2) => ct1.name.localeCompare(ct2.name));

            filterContentTypes();

            const sectionVisibility = accessChecker.getSectionVisibility();
            $scope.context.forbidden = !sectionVisibility.contentType;
            $scope.context.ready = true;
          }, accessChecker.wasForbidden($scope.context));
      }

      function onViewChange() {
        const { list, searchTerm } = $scope.context;
        viewPersistor.save({ list, searchTerm });
        filterContentTypes();
      }

      function filterContentTypes() {
        $scope.visibleContentTypes = $scope.contentTypes
          .filter(isOnSelectedList)
          .filter(matchesSearchTerm);
      }

      function isOnSelectedList(ct) {
        switch ($scope.context.list) {
          case 'changed':
            return isPublishedAndUpdated(ct);
          case 'active':
            return isPublished(ct);
          case 'draft':
            return isNotPublished(ct);
          default:
            return true;
        }
      }

      function matchesSearchTerm(ct) {
        const { searchTerm } = $scope.context;
        if (isNonEmptyString(searchTerm)) {
          return normalizeName(ct.name).includes(normalizeName(searchTerm));
        } else {
          return true;
        }
      }

      // TODO extract the following methods.
      // There is already `EntityStatus.es6` but it
      // operates on legacy CMA client entities.
      function getStatusLabel(ct) {
        if (isPublishedAndUpdated(ct)) {
          return 'updated';
        } else if (isPublished(ct)) {
          return 'published';
        } else {
          return 'draft';
        }
      }

      function isPublished(entity) {
        return !!entity.sys.publishedVersion;
      }

      function isNotPublished(entity) {
        return !isPublished(entity);
      }

      function isPublishedAndUpdated(entity) {
        return isPublished(entity) && entity.sys.version > entity.sys.publishedVersion + 1;
      }
    }
  ]);
