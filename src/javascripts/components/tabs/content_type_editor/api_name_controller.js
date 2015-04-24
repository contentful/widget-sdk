'use strict';
/**
 * This controller deals with locking/unlocking the editing mechanism for the apiName property of fields.
 *
 * It also takes care of automatically populating that property based on the field name when the field is first created
 * or for fields that could've been created by users before we had the apiName property and which never
 * had that field populated for them.
 *
 * However, when doing this automatically it will verify if the current api name we're operating on is empty or
 * the same as the field name. If not, it's because the user has specified their own apiName and it won't touch the property.
 */
angular.module('contentful').controller('ApiNameController', ['$scope', '$injector', function ApiNameController($scope, $injector){
  var controller = this;

  var modalDialog  = $injector.get('modalDialog');
  var stringUtils  = $injector.get('stringUtils');
  var isDisplayableAsTitleFilter = $injector.get('isDisplayableAsTitleFilter');

  this._publishedApiName  = publishedApiName();
  this._originalFieldName = $scope.field.name || '';
  this._locked        = true;

  this.updateFromName = updateFromName;
  this.isEditable     = isEditable;
  this.isRevertable   = isRevertable;
  this.unlockEditing  = unlockEditing;
  this.lockEditing    = lockEditing;
  this.revert         = revert;

  $scope.$watch('publishedContentType.data.sys.revision', publishedCounterChanged);

  function updateFromName() {
    var currentApiName = $scope.field.apiName || '';
    if (controller.isEditable() && stringUtils.toIdentifier(controller._originalFieldName) == currentApiName){
      updateApiName($scope.field.name ? stringUtils.toIdentifier($scope.field.name) : '');
    }
    controller._originalFieldName = $scope.field.name || '';
  }

  function updateApiName(newApiName) {
    var isDisplayField = $scope.isDisplayField();
    $scope.field.apiName = newApiName;
    if (isDisplayField ||
        _.isEmpty($scope.contentType.data.displayField) && isDisplayableAsTitleFilter($scope.field)) {
      $scope.setDisplayField($scope.field);
    }
  }

  function isEditable() {
    return !isApiNamePublished() || !(controller._locked);
  }

  function isRevertable() {
    return !isApiNamePublished();
  }

  function unlockEditing() {
    if (!controller._locked) return;
    modalDialog.open({
      title: 'Warning!',
      message: 'Changing the ID of a published field will interrupt the delivery of your content to applications that currently display it.<br><br>'+
        'Change field ID only if you plan to update your client applications as well.<br><br>'+
        'Consult our <a href="https://support.contentful.com/hc/en-us/articles/204101273">Knowledge base</a> for more information on updating published Content Types.',
      html: true,
      scope: $scope,
      cancelLabel: 'Skip editing',
      confirmLabel: 'Edit field ID',
      noBackgroundClose: true,
    }).promise.then(function () {
      controller._locked = false;
    });
  }

  function lockEditing() {
    controller._locked = true;
  }

  function revert() {
    var oldName = publishedApiName();
    updateApiName(oldName);
    lockEditing();
  }

  function publishedApiName() {
    var publishedFields = dotty.get($scope, 'publishedContentType.data.fields');
    var field = _.find(publishedFields, {id: $scope.field.id});
    return field && field.apiName;
  }

  function publishedCounterChanged(newCount, oldCount) {
    controller._publishedApiName = publishedApiName();
    if (newCount !== oldCount) lockEditing();
  }

  function isApiNamePublished() {
    /*jshint eqnull: true*/
    var effectiveApiName = $scope.field.apiName == null ? $scope.field.id : $scope.field.apiName;
    var effectivePublishedApiName = controller._publishedApiName == null ? $scope.field.id : controller._publishedApiName;

    return effectiveApiName === effectivePublishedApiName;
  }
}]);
