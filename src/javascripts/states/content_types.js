'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/contentTypes
 */
.factory('states/contentTypes', ['require', function (require) {
  var contextHistory = require('contextHistory');

  var base = require('states/base');
  var resolvers = require('states/resolvers');

  var listEntity = {
    getTitle: _.constant('Content model'),
    link: { state: 'spaces.detail.content_types.list' },
    getType: _.constant('ContentTypes'),
    getId: _.constant('CONTENTTYPES')
  };

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading content model...',
    controller: ['$scope', function ($scope) {
      contextHistory.addEntity(listEntity);
      $scope.context = {};
    }],
    template: '<div cf-content-type-list class="workbench"></div>'
  });

  var fields = {
    name: 'fields',
    url: '/fields'
  };

  var preview = {
    name: 'preview',
    url: '/preview'
  };

  var newState = editorBase({
    name: 'new',
    url: '_new',
    children: [
      {
        name: 'home',
        url: '',
        redirectTo: 'spaces.detail.content_types.new.fields'
      }, fields, preview
    ],
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
    children: [
      {
        name: 'home',
        url: '',
        redirectTo: 'spaces.detail.content_types.detail.fields'
      }, fields, preview
    ],
    data: {
      isNew: false
    },
    resolve: {
      contentType: ['require', '$stateParams', 'space', function (require, $stateParams, space) {
        var ctHelpers = require('data/ContentTypes');
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
      editingInterface: resolvers.editingInterface
    }
  });

  return {
    name: 'content_types',
    url: '/content_types',
    abstract: true,
    children: [list, newState, detail]
  };

  function editorBase (options) {
    return _.extend({
      params: { addToContext: true },
      abstract: true,
      controller: [
        '$scope', 'require', 'contentType', 'editingInterface', 'publishedContentType',
        function ($scope, require, contentType, editingInterface, publishedContentType) {
          var $state = require('$state');
          var $stateParams = require('$stateParams');

          var contentTypeId = $stateParams.contentTypeId;
          var id = options.data.isNew ? 'CONTENTTYPENEW' : contentTypeId;
          var state = 'spaces.detail.content_types.';
          state += options.data.isNew ? 'new' : 'detail';

          var params = options.data.isNew ? undefined : { contentTypeId: contentTypeId };

          $scope.context = $state.current.data;
          $scope.contentType = contentType;
          $scope.editingInterface = editingInterface;
          $scope.publishedContentType = publishedContentType;

          // add parent state
          contextHistory.addEntity(listEntity);

          // add current state
          contextHistory.addEntity({
            getTitle: function () {
              return contentType.getName() + ($scope.context.dirty ? '*' : '');
            },
            link: {
              state: state,
              params: params
            },
            getType: _.constant('ContentType'),
            getId: _.constant(id)
          });
        }
      ],
      template:
      '<div ' + [
        'cf-content-type-editor',
        'class="workbench"',
        'cf-validate="contentType.data" cf-content-type-schema',
        'cf-ui-tab'
      ].join(' ') + '></div>'
    }, options);
  }

}]);
