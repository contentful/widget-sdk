import _ from 'lodash';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog.es6';

export default {
  name: 'content_preview',
  url: '/content_preview',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      template:
        '<react-component name="app/settings/content_preview/routes/ContentPreviewListRoute.es6" />'
    },
    {
      name: 'new',
      url: '/new',
      template:
        '<react-component name="app/settings/content_preview/routes/ContentPreviewNewRoute.es6" props="props" />',
      controller: [
        '$scope',
        $scope => {
          $scope.props = {
            registerSaveAction: save => {
              $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
              $scope.$applyAsync();
            },
            setDirty: value => {
              $scope.context.dirty = value;
              $scope.$applyAsync();
            }
          };
        }
      ]
    },
    {
      name: 'detail',
      url: '/:contentPreviewId',
      template:
        '<react-component name="app/settings/content_preview/routes/ContentPreviewEditRoute.es6" props="props" />',
      controller: [
        '$scope',
        '$stateParams',
        ($scope, $stateParams) => {
          $scope.props = {
            contentPreviewId: $stateParams.contentPreviewId,
            registerSaveAction: save => {
              $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
              $scope.$applyAsync();
            },
            setDirty: value => {
              $scope.context.dirty = value;
              $scope.$applyAsync();
            }
          };
        }
      ]
    }
  ]
};
