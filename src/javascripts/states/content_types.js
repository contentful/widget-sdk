'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/contentTypes
 */
.factory('states/contentTypes', ['require', function (require) {
  var contextHistory = require('contextHistory');
  var crumbFactory = require('navigation/CrumbFactory');

  var base = require('states/base');
  var resolvers = require('states/resolvers');

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading content model...',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
      contextHistory.add(crumbFactory.ContentTypeList());
    }],
    template: '<div cf-content-type-list class="workbench entity-list"></div>'
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
    // A/B experiment - ps-03-2017-next-step-hints
    params: {
      showNextStepHint: null
    },
    // End A/B experiment - ps-03-2017-next-step-hints
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

          $scope.context = $state.current.data;
          $scope.contentType = contentType;
          $scope.editingInterface = editingInterface;
          $scope.publishedContentType = publishedContentType;

          contextHistory.add(crumbFactory.ContentTypeList());
          contextHistory.add(crumbFactory.ContentType($stateParams.contentTypeId, $scope.context));
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
