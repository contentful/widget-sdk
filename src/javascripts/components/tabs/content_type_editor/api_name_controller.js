'use strict';
/**
 * @ngdoc type
 * @name ApiNameController
 * @description
 * This controller deals with locking/unlocking the editing mechanism
 * for the apiName property of fields.
 */
angular.module('contentful')
.controller('ApiNameController', ['$scope', '$injector', function ApiNameController($scope, $injector){
  var controller = this;

  var modalDialog         = $injector.get('modalDialog');
  var $q                  = $injector.get('$q');
  var getKnowledgeBaseUrl = $injector.get('KnowledgeBase/getUrl');

  /**
   * @ngdoc method
   * @name ApiNameController#isEditable
   * @returns boolean
   * @description
   * Returns true if the field has not been published, or if the
   * editing has been unlocked by the user with `unlockEditing()`.
   */
  this.isEditable     = isEditable;

  /**
   * @ngdoc method
   * @name ApiNameController#unlockEditing
   * @returns Promise<boolean>
   * @description
   * Shows a confirmation dialog that asks the user to make to api name
   * editable.
   */
  this.unlockEditing  = unlockEditing;

  this._unlocked      = false;


  function isEditable() {
    return !controller._fieldPublished || controller._unlocked;
  }

  function unlockEditing() {
    if (controller._unlocked)
      return $q.resolve(true);

    return modalDialog.open({
      title: 'Edit field ID',
      message: '<p>Changing the ID of a published field will interrupt the delivery ' +
               'of your content to applications that currently display it. '+
               'Change the field ID only if you plan to update your client applications ' +
               'as well.</p>'+
               '<p>Consult our <a href="' + getKnowledgeBaseUrl('id_change') + '">' +
               'knowledge base</a> for more information on updating published content types.</p>',
      html: true,
      scope: $scope,
      confirmLabel: 'Edit field ID'
    }).promise.then(function () {
      controller._unlocked = true;
    });
  }

  $scope.$watch('publishedContentType.data.fields', function () {
    var publishedFields = dotty.get($scope, 'publishedContentType.data.fields');
    var field = _.find(publishedFields, {id: $scope.field.id});
    controller._fieldPublished = !!field;
  });
}]);
