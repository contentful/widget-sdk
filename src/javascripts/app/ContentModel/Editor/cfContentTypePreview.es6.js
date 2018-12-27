import { registerDirective, registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import contentTypePreviewTemplateDef from 'app/ContentModel/Editor/ContentTypePreviewTemplate.es6';

/**
 * @ngdoc directive
 * @name cfContentTypePreview
 * @scope.requires {Client.ContentType} contentType
 */
registerDirective('cfContentTypePreview', [
  'contentTypePreview',
  getContentTypePreview => {
    return {
      scope: true,
      restrict: 'E',
      template: contentTypePreviewTemplateDef(),
      controller: [
        '$scope',
        $scope => {
          $scope.$watch(
            'contentType.data',
            data => {
              const publishedVersion = _.get(data, 'sys.publishedVersion');
              $scope.isNew = !publishedVersion;

              loadPreview($scope.isNew).then(preview => {
                $scope.preview = preview;
              });
            },
            true
          );

          function loadPreview(isNew) {
            if (isNew) {
              return loadLocalPreview();
            } else {
              return loadServerPreview();
            }
          }

          function loadServerPreview() {
            $scope.isLoading = true;
            return getContentTypePreview($scope.contentType).then(preview => {
              $scope.isLoading = false;
              return preview;
            });
          }

          function loadLocalPreview() {
            return getContentTypePreview.fromData($scope.contentType);
          }
        }
      ]
    };
  }
]);

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
registerFactory('contentTypePreview', [
  '$q',
  $q => {
    const orderedKeys = ['name', 'description', 'displayField', 'fields', 'sys'];

    getContentTypePreview.fromData = fromData;
    return getContentTypePreview;

    function getContentTypePreview(contentType) {
      return contentType
        .endpoint()
        .headers({ 'X-Contentful-Skip-Transformation': false })
        .get()
        .then(orderPreviewKeys);
    }

    function fromData(contentType) {
      return $q
        .resolve(contentType.data)
        .then(orderPreviewKeys)
        .then(omitApiName);
    }

    // We rely on the fact the keys are displayed in the order they
    // were added.
    function orderPreviewKeys(data) {
      const ordered = _.transform(
        orderedKeys,
        (preview, key) => {
          preview[key] = data[key];
        },
        {}
      );
      return _.defaults(ordered, data);
    }

    function omitApiName(data) {
      data.fields = _.map(data.fields, field => _.omit(field, 'apiName'));
      return data;
    }
  }
]);
