'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/contentTypes
 */
.factory('states/contentTypes', ['$injector', function ($injector) {
  var base = $injector.get('states/base');
  var resolvers = $injector.get('states/resolvers');

  var list = base({
    name: 'list',
    url: '',
    ncyBreadcrumb: {
      label: 'Content model'
    },
    loadingText: 'Loading content model...',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: '<div cf-content-type-list class="workbench"></div>'
  });

  var newState = editorBase({
    name: 'new',
    url: '_new',
    data: {
      isNew: true
    },
    resolve: {
      contentType: ['space', function (space) {
        return space.newContentType({sys: {type: 'ContentType'}, fields: []});
      }],
      editingInterface: resolvers.editingInterface,
      publishedContentType: [function () {
        return null;
      }]
    }
  });

  var detail = editorBase({
    name: 'detail',
    url: '/:contentTypeId',
    data: {
      isNew: false
    },
    resolve: {
      contentType: ['$injector', '$stateParams', 'space', function ($injector, $stateParams, space) {
        var ctHelpers = $injector.get('data/ContentTypes');
        return space.getContentType($stateParams.contentTypeId)
        .then(function (ct) {
          // Some legacy content types do not have a name. If it is
          // missing we set it to 'Untitled' so we can display
          // something in the UI. Note that the API requires new
          // Content Types to have a name.
          ctHelpers.assureName(ct.data);
          return ct;
        });
      }],
      publishedContentType: ['contentType', function (contentType) {
        return contentType.getPublishedStatus().catch(function (err) {
          if (err.statusCode === 404) {
            return null;
          } else {
            throw err;
          }
        });
      }],
      editingInterface: resolvers.editingInterface,
    },
  });

  return {
    name: 'content_types',
    url: '/content_types',
    abstract: true,
    template: '<ui-view/>',
    children: [list, newState, detail]
  };

  function editorBase (options) {
    return _.extend({
      ncyBreadcrumb: {
        parent: 'spaces.detail.content_types.list',
        label: '{{contentType.getName() + (context.dirty ? "*" : "")}}'
      },
      controller:
        ['$state', '$scope', 'contentType', 'editingInterface', 'publishedContentType',
          function ($state, $scope, contentType, editingInterface, publishedContentType) {
        $scope.context = $state.current.data;
        $scope.contentType = contentType;
        $scope.editingInterface = editingInterface;
        $scope.publishedContentType = publishedContentType;
      }],
      template:
      '<div ' + [
        'cf-content-type-editor',
        'class="workbench"',
        'cf-validate="contentType.data" cf-content-type-schema',
        'cf-ui-tab',
      ].join(' ') + '></div>'
    }, options);
  }
}]);
