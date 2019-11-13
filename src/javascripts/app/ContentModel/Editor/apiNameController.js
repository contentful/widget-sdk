import { registerController } from 'NgRegistry';

export default function register() {
  /**
   * @ngdoc type
   * @name ApiNameController
   * @description
   * This controller deals with locking/unlocking the editing mechanism
   * for the apiName property of fields.
   */
  registerController('ApiNameController', [
    '$scope',
    '$q',
    'modalDialog',
    function ApiNameController($scope, $q, modalDialog) {
      /**
       * @ngdoc method
       * @name ApiNameController#isEditable
       * @returns boolean
       * @description
       * Returns true if the field has not been published, or if the
       * editing has been unlocked by the user with `unlockEditing()`.
       */
      this.isEditable = isEditable;

      /**
       * @ngdoc method
       * @name ApiNameController#unlockEditing
       * @returns Promise<boolean>
       * @description
       * Shows a confirmation dialog that asks the user to make to api name
       * editable.
       */
      this.unlockEditing = unlockEditing;

      let unlocked = false;

      function isEditable() {
        const isFieldPublished = !!$scope.ctEditorController.getPublishedField($scope.field.id);
        return !isFieldPublished || unlocked;
      }

      function unlockEditing() {
        if (unlocked) {
          return $q.resolve(true);
        }

        return modalDialog
          .open({
            title: 'Edit field ID',
            message:
              '<p>Changing the ID of a published field will interrupt the delivery ' +
              'of your content to applications that currently display it. ' +
              'Change the field ID only if you plan to update your client applications ' +
              'as well.</p>' +
              `<p>Consult our <react-component name="components/shared/knowledge_base_icon/KnowledgeBase" props="{target: 'id_change', text: 'knowledge base', inlineText: true}" />` +
              ' for more information on updating published content types.</p>',
            html: true,
            scope: $scope,
            confirmLabel: 'Edit field ID'
          })
          .promise.then(() => {
            unlocked = true;
          });
      }
    }
  ]);
}
