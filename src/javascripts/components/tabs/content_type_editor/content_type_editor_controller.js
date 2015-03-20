'use strict';

angular.module('contentful').controller('ContentTypeEditorController',
            ['$scope', '$injector', function ContentTypeEditorController($scope, $injector) {
  var $controller       = $injector.get('$controller');
  var analytics         = $injector.get('analytics');
  var editingInterfaces = $injector.get('editingInterfaces');
  var environment       = $injector.get('environment');
  var random            = $injector.get('random');
  var validation        = $injector.get('validation');

  $scope.entityActionsController = $controller('EntityActionsController', {
    $scope: $scope,
    entityType: 'contentType'
  });

  $scope.tab.closingMessage            = 'You have unpublished changes.';
  $scope.tab.closingMessageDisplayType = 'tooltip';
  $scope.fieldSchema                   = validation(validation.schemas.ContentType.at(['fields']).items);
  $scope.openEditingInterfaceEditor    = openEditingInterfaceEditor;
  $scope.regulateDisplayField          = regulateDisplayField;
  $scope.updatePublishedContentType    = updatePublishedContentType;
  $scope.addField                      = addField;

  $scope.$watch('tab.params.contentType',        loadContentType);
  $scope.$watch('contentType.data.fields',       checkForDirtyForm, true);
  $scope.$watch('contentType.data.displayField', checkForDirtyForm);
  $scope.$watch('contentTypeForm.$dirty',        reloadPublisedContentType);

  $scope.$watch('contentType.data.fields.length', function(length) {
    $scope.hasFields = length > 0;
  });

  $scope.$watch('publishedContentType.data.fields', function (fields, old, scope) {
    scope.publishedIds = _.pluck(fields, 'id');
    scope.publishedApiNames = _.pluck(fields, 'apiName');
  });

  $scope.$watch('contentType.getName()', function(title) {
    $scope.tab.title = title;
  });

  $scope.$watch(function contentTypeModifiedWatcher() {
    return contentTypeIsDirty() || $scope.contentTypeForm.$dirty;
  }, function (modified, old, scope) {
    if (modified !== undefined) scope.tab.dirty = modified;
  });

  $scope.$on('entityDeleted', handleEntityDeleted);

  this.interfaceEditorEnabled = $scope.user.features.showPreview || environment.env !== 'production';

  function loadContentType(contentType) {
    $scope.contentType = contentType;
    if (!_.isEmpty($scope.contentType.data.fields)) $scope.validate();
    loadPublishedContentType();
  }

  function reloadPublisedContentType(dirty){
    if (dirty){
      loadPublishedContentType();
    }
  }

  function checkForDirtyForm(newVal, oldVal) {
    if(newVal !== oldVal) {
      $scope.contentTypeForm.$setDirty();
    }
  }

  function loadPublishedContentType() {
    // TODO replace with lookup in registry inside spaceContext
    $scope.contentType.getPublishedStatus()
    .then(function(publishedContentType){
      $scope.publishedContentType = publishedContentType;
    });
  }

  function contentTypeIsDirty() {
    return $scope.contentType && $scope.contentType.getVersion() > $scope.contentType.getPublishedVersion() + 1;
  }

  function handleEntityDeleted(event, contentType) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (contentType === scope.contentType) {
        scope.tab.close();
      }
    }
  }

  /**
   * Accounts for displayField value inconsistencies for content types which existed
   * before the internal apiName content type property.
   */
  function regulateDisplayField() {
    var displayField = $scope.contentType.data.displayField;
    var valid = _.isUndefined(displayField) || displayField === null || _.any($scope.contentType.data.fields, {id: displayField});
    if (!valid)
      $scope.contentType.data.displayField = null;
  }

  function updatePublishedContentType (publishedContentType) {
    $scope.publishedContentType = publishedContentType;
  }

  function addField(typeFieldTemplate) {
    var newField = _.extend({
      name: '',
      id: random.id(),
      type: 'String',
      apiName: ''
    }, typeFieldTemplate);

    if(!_.has($scope.contentType.data, 'fields'))
      $scope.contentType.data.fields = [];
    $scope.contentType.data.fields.push(newField);
    $scope.$broadcast('fieldAdded', $scope.contentType.data.fields.length - 1);
    analytics.modifiedContentType('Modified ContentType', $scope.contentType, newField, 'add');
  }

  function openEditingInterfaceEditor() {
    // TODO This is a mess. We're doing four calls:
    // 1. here getting the editinginterface
    // 2. In TabViewController#openTab we get the contenType
    // 3. Then we get the published Version
    // 4. Then we get the editingInterface again
    //
    // First improvement would be to provide Space#getPublishedContentType
    // Better would be to get at the content Types through the spaceContext
    // if they are already loaded, so we don't need a ajax call at all OR, use
    // what we have and asynchronously trigger a call to update the .data
    // property after we have already opened the editor
    //
    // https://www.pivotaltracker.com/story/show/82148572
    editingInterfaces.forContentTypeWithId($scope.publishedContentType, 'default')
    .then(function (interf) {
      $scope.navigator.editingInterfaceEditor($scope.publishedContentType, interf).goTo();
    });
  }


}]);
