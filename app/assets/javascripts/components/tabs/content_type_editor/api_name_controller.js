'use strict';
angular.module('contentful').controller('ApiNameController', ['$scope', '$injector', function ApiNameController($scope, $injector){
  var controller = this;

  var notification = $injector.get('notification');
  var modalDialog  = $injector.get('modalDialog');
  var stringUtils  = $injector.get('stringUtils');
  var isDisplayableAsTitleFilter = $injector.get('isDisplayableAsTitleFilter');

  this._publishedName = publishedApiName();
  this._oldName       = $scope.field.name || '';
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
    if (controller.isEditable() && stringUtils.toIdentifier(controller._oldName) == currentApiName){
      otUpdateApiName($scope.field.name ? stringUtils.toIdentifier($scope.field.name) : '');
    }
    controller._oldName = $scope.field.name || '';
  }

  function otUpdateApiName(newApiName) {
    var isDisplayField = $scope.isDisplayField();
    $scope.field.apiName = newApiName;

    if (!$scope.otDoc) return false;
    var subdoc = $scope.otDoc.at(['fields', $scope.index, 'apiName']);
    subdoc.set(newApiName, function(err) {
      $scope.$apply(function (scope) {
        if (err) {
          scope.field.apiName = subdoc.get();
          notification.serverError('Error updating ID', err);
          return;
        }
        if (isDisplayField ||
            _.isEmpty($scope.contentType.data.displayField) && isDisplayableAsTitleFilter($scope.field)) {
          $scope.setDisplayField($scope.field);
        }
      });
    });
  }

  function isEditable() {
    return !apiNamePublished() || !(controller._locked);
  }

  function isRevertable() {
    return !apiNamePublished();
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
    }).then(function () {
      controller._locked = false;
    });
  }

  function lockEditing() {
    controller._locked = true;
  }

  function revert() {
    var oldName = publishedApiName();
    otUpdateApiName(oldName);
    lockEditing();
  }

  function publishedApiName() {
    var publishedFields = dotty.get($scope, 'publishedContentType.data.fields');
    var field = _.find(publishedFields, {id: $scope.field.id});
    return field && field.apiName;
  }

  function publishedCounterChanged(newCount, oldCount) {
    controller._publishedName = publishedApiName();
    if (newCount !== oldCount) lockEditing();
  }

  function apiNamePublished() {
    /*jshint eqnull: true*/
    var effectivePublishedName = controller._publishedName == null ? $scope.field.id : controller._publishedName;
    var effectiveName = $scope.field.apiName == null ? $scope.field.id : $scope.field.apiName;

    return effectiveName === effectivePublishedName;
  }
}]);
