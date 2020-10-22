import { registerController, registerDirective } from 'core/NgRegistry';
import _ from 'lodash';
import { openCreateContentTypeDialog } from './Dialogs';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import * as accessChecker from 'access_control/AccessChecker';
import ContentTypesPage from 'app/ContentModel/Editor/ContentTypesPage';

export default function register() {
  registerDirective('cfContentTypeEditor', [
    () => ({
      template: '<react-component component="component" props="componentProps"></react-component>',
      restrict: 'A',
      controller: 'ContentTypeEditorController',
      controllerAs: 'ctEditorController',
    }),
  ]);

  /**
   * @scope.requires  context
   * @scope.provides  contentType
   */
  // todo: need to write tests for this view once is fully migrated to React
  registerController('ContentTypeEditorController', [
    '$scope',
    '$state',
    function ContentTypeEditorController($scope, $state) {
      $scope.context.dirty = false;

      // We want to track if the user is creating a new CT, but the save
      // action is enforced. Somehow they got to this page, but weren't
      // able to save the CT.

      if ($scope.context.isNew) {
        const openCreateDialog = async () => {
          openCreateContentTypeDialog($scope.contentTypeIds).then(
            (result) => {
              if (result) {
                $scope.contentType.data.name = result.name;
                $scope.contentType.data.description = result.description;
                $scope.contentType.data.sys.id = result.contentTypeId;
              } else {
                // X.detail.fields -> X.list
                $state.go('^.^.list');
              }
            },
            () => {}
          );
        };
        openCreateDialog();
      }

      function getCurrentTab($state) {
        if ($state.is('^.preview')) {
          return 'preview';
        } else if ($state.is('^.sidebar_configuration')) {
          return 'sidebar_configuration';
        } else if ($state.is('^.entry_editor_configuration')) {
          return 'entry_editor_configuration';
        }
        return 'fields';
      }

      $scope.$watch(
        () => $state.current.name,
        () => {
          $scope.componentProps = {
            ...$scope.componentProps,
            currentTab: getCurrentTab($state),
          };
          $scope.$applyAsync();
        }
      );

      // function to initialise leave confirmation with React State action
      function initRequestLeaveConfirmation(saveAndClose) {
        $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(saveAndClose);
      }

      function updateContextDirty(dirty) {
        $scope.context.dirty = dirty;
        $scope.$applyAsync();
      }

      function saveContentType(contentTypeData) {
        $scope.contentType.data = contentTypeData;
        return $scope.contentType.save();
      }

      $scope.component = ContentTypesPage;
      $scope.componentProps = {
        isNew: $scope.context.isNew,
        contentTypeIds: $scope.contentTypeIds,
        currentTab: getCurrentTab($state),
        canEdit: accessChecker.can('update', 'ContentType'),
        editorInterface: $scope.editorInterface,
        publishedContentType: $scope.publishedContentType,
        sidebarConfiguration: $scope.editorInterface.sidebar,
        editorConfiguration: $scope.editorInterface.editors,
        extensions: $scope.customWidgets,
        spaceData: {
          organizationId: $scope.spaceContext.getData(['organization', 'sys', 'id']),
          spaceId: $scope.spaceContext.getId(),
          environmentId: $scope.spaceContext.getEnvironmentId(),
        },
        contentType: $scope.contentType,
        hasAdvancedExtensibility: $scope.hasAdvancedExtensibility,
        saveContentType,
        updateContextDirty,
        initRequestLeaveConfirmation,
      };
    },
  ]);
}
