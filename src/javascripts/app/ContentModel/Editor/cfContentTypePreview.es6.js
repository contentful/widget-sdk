import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';

export default function register() {
  const orderedKeys = ['name', 'description', 'displayField', 'fields', 'sys'];

  function getContentTypePreview(contentType) {
    return contentType
      .endpoint()
      .headers({ 'X-Contentful-Skip-Transformation': false })
      .get()
      .then(orderPreviewKeys);
  }

  getContentTypePreview.fromData = contentType => {
    return Promise.resolve(contentType.data)
      .then(orderPreviewKeys)
      .then(omitApiName);
  };

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

  /**
   * @ngdoc directive
   * @name cfContentTypePreview
   * @scope.requires {Client.ContentType} contentType
   */
  registerDirective('cfContentTypePreview', [
    () => {
      return {
        scope: true,
        restrict: 'E',
        template:
          '<react-component name="app/ContentModel/Editor/PreviewTab/ContentTypePreview.es6" props="props" />',
        controller: [
          '$scope',
          $scope => {
            $scope.props = {
              isLoading: false,
              isNew: false,
              isDirty: false,
              preview: null
            };

            function updateProps(update) {
              $scope.props = {
                ...$scope.props,
                ...update
              };
              $scope.$applyAsync();
            }

            $scope.$watch('contentTypeForm.$dirty', isDirty => {
              updateProps({
                isDirty
              });
            });

            $scope.$watch(
              'contentType.data',
              data => {
                const publishedVersion = _.get(data, 'sys.publishedVersion');

                const isNew = !publishedVersion;

                updateProps({
                  isNew
                });

                loadPreview(isNew).then(preview => {
                  updateProps({
                    preview
                  });
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
              updateProps({
                isLoading: true
              });

              return getContentTypePreview($scope.contentType).then(preview => {
                updateProps({
                  isLoading: false
                });
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
}
