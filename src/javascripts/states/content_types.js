'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/contentTypes
 */
.factory('states/contentTypes', ['require', function (require) {
  var contextHistory = require('contextHistory');
  var crumbFactory = require('navigation/CrumbFactory');

  var base = require('states/Base').default;
  var resolvers = require('states/resolvers');

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading content model…',
    template: '<div cf-content-type-list class="workbench entity-list"></div>'
  });

  var fields = {
    name: 'fields',
    url: '/fields',
    params: {
      addToContext: true
    }
  };

  var preview = {
    name: 'preview',
    url: '/preview',
    params: {
      addToContext: true
    }
  };

  var newState = editorBase({
    name: 'new',
    url: '_new',
    resolve: {
      contentType: ['spaceContext', function (spaceContext) {
        return spaceContext.space.newContentType({sys: {type: 'ContentType'}, fields: []});
      }],
      editingInterface: resolvers.editingInterface,
      publishedContentType: [function () {
        return null;
      }]
    }
  }, true);

  var detail = editorBase({
    name: 'detail',
    url: '/:contentTypeId',
    resolve: {
      contentType: ['require', '$stateParams', 'spaceContext', function (require, $stateParams, spaceContext) {
        var space = spaceContext.space;
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
  }, false);

  return {
    name: 'content_types',
    url: '/content_types',
    abstract: true,
    children: [list, newState, detail]
  };

  function editorBase (options, isNew) {
    return _.extend({
      redirectTo: '.fields',
      children: [ fields, preview ],
      controller: [
        '$scope', '$stateParams', 'contentType', 'editingInterface', 'publishedContentType',
        function ($scope, $stateParams, contentType, editingInterface, publishedContentType) {
          $scope.context.isNew = isNew;
          $scope.contentType = contentType;
          $scope.editingInterface = editingInterface;
          $scope.publishedContentType = publishedContentType;

          contextHistory.set([
            crumbFactory.ContentTypeList(),
            crumbFactory.ContentType($stateParams.contentTypeId, $scope.context)
          ]);
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
