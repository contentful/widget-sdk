'use strict';

angular.module('contentful')

/**
 * @ngdoc directive
 * @name cfContentTypePreview
 * @scope.requires {Client.ContentType} contentType
 */
.directive('cfContentTypePreview', ['$injector', function ($injector) {
  var getContentTypePreview = $injector.get('contentTypePreview');
  return {
    scope: true,
    restrict: 'E',
    template: JST.cf_content_type_preview(),
    controller: ['$scope', function ($scope) {

      $scope.$watch('contentType.data.sys.publishedVersion', function (version) {
        $scope.isNew = !version;
        loadPreview($scope.isNew)
        .then(function (preview) {
          $scope.preview = preview;
        });
      });

      function loadPreview (isNew) {
        if (isNew)
          return loadLocalPreview();
        else
          return loadServerPreview();
      }

      function loadServerPreview () {
        $scope.isLoading = true;
        return getContentTypePreview($scope.contentType)
        .then(function (preview) {
          $scope.isLoading = false;
          return preview;
        });
      }

      function loadLocalPreview () {
        return getContentTypePreview.fromData($scope.contentType);
      }

    }]
  };
}])

/**
 * @ngdoc service
 * @name contentTypePreview
 * @usage[js]
 * contentTypePreview(contentType)
 * .then(function (data) {
 *   console.log(data)
 * })
 *
 * @description
 * Retrieves the content type data from the CMA in a promise.
 *
 * It does not skip transformations so that the data is the actual API
 * response.
 */
.factory('contentTypePreview', ['$q', function ($q) {
  var orderedKeys = ['name', 'description', 'displayField', 'fields', 'sys'];

  getContentTypePreview.fromData = fromData;
  return getContentTypePreview;

  function getContentTypePreview (contentType) {
    return contentType.endpoint()
    .headers({'X-Contentful-Skip-Transformation': false})
    .get().then(orderPreviewKeys);
  }

  function fromData (contentType) {
    return $q.when(contentType.data).then(orderPreviewKeys);
  }

  // We rely on the fact the keys are displayed in the order they
  // were added.
  function orderPreviewKeys (data) {
    var ordered =_.transform(orderedKeys, function (preview, key) {
      preview[key] = data[key];
    }, {});
    return _.defaults(ordered, data);
  }
}]);
