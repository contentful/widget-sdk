import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import ContentPreviewListRoute from './ContentPreviewListRoute';
import ContentPreviewNewRoute from './ContentPreviewNewRoute';
import ContentPreviewEditRoute from './ContentPreviewEditRoute';

export default {
  name: 'content_preview',
  url: '/content_preview',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: ContentPreviewListRoute
    },
    {
      name: 'new',
      url: '/new',
      component: ContentPreviewNewRoute,
      mapInjectedToProps: [
        '$scope',
        $scope => {
          return {
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
      component: ContentPreviewEditRoute,
      mapInjectedToProps: [
        '$scope',
        '$stateParams',
        ($scope, { contentPreviewId }) => {
          return {
            contentPreviewId,
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
