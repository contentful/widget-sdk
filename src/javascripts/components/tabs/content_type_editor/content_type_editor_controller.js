'use strict';

angular.module('contentful').controller('ContentTypeEditorController', ['$scope', '$injector', function ContentTypeEditorController($scope, $injector) {
  var $controller       = $injector.get('$controller');
  var $q                = $injector.get('$q');
  var ShareJS           = $injector.get('ShareJS');
  var analytics         = $injector.get('analytics');
  var editingInterfaces = $injector.get('editingInterfaces');
  var environment       = $injector.get('environment');
  var logger            = $injector.get('logger');
  var notification      = $injector.get('notification');
  var random            = $injector.get('random');
  var validation        = $injector.get('validation');

  $controller('EntityActionsController', {
    $scope: $scope,
    params: {
      entityType: 'contentType',
      methodOverrides: {
        canPublish: function() {
          if (!$scope.otDoc) return false;
          var version = $scope.otDoc.version;
          var publishedVersion = $scope.otDoc.getAt(['sys', 'publishedVersion']);
          var notPublishedYet = !publishedVersion;
          var updatedSincePublishing = version !== publishedVersion + 1;
          var fields = $scope.otDoc.getAt(['fields']);
          var hasFields = fields && fields.length > 0;
          return $scope.contentType.canPublish() &&
            (notPublishedYet || updatedSincePublishing) &&
            hasFields &&
            $scope.permissionController.can('publish', $scope.contentType.data).can;
        }
      }
    }
  });

  this.interfaceEditorEnabled = $scope.user.features.showPreview || environment.env !== 'production';

  $scope.fieldSchema = validation(validation.schemas.ContentType.at(['fields']).items);
  $scope.tab.closingMessage = 'You have unpublished changes.';
  $scope.tab.closingMessageDisplayType = 'tooltip';
  $scope.openEditingInterfaceEditor = openEditingInterfaceEditor;
  $scope.sanitizeDisplayField = sanitizeDisplayField;

  $scope.$watch('tab.params.contentType', function (contentType) { $scope.contentType = contentType; });

  $scope.$watch(function contentTypeEditorEnabledWatcher(scope) {
    return scope.contentType && scope.permissionController.can('update', scope.contentType.data).can;
  }, function contentTypeEditorEnabledHandler(enabled, old, scope) {
    scope.otDisabled = !enabled;
  });

  function loadPublishedContentType() {
    // TODO replace with lookup in registry inside spaceContext
    $scope.contentType.getPublishedStatus()
    .then(function(publishedContentType){
      $scope.publishedContentType = publishedContentType;
    });
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
    editingInterfaces.forContentTypeWithId($scope.spaceContext.space, $scope.publishedContentType, 'default')
    .then(function (interf) {
      $scope.navigator.editingInterfaceEditor($scope.publishedContentType, interf).goTo();
    });
  }

  $scope.$watch('contentType', function(contentType){
    if (contentType){
      loadPublishedContentType();
    }
  });

  $scope.$on('entityDeleted', function (event, contentType) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (contentType === scope.contentType) {
        scope.tab.close();
      }
    }
  });

  $scope.$on('otRemoteOp', function (event) {
    event.currentScope.otUpdateEntity();
  });

  $scope.$watch(function contentTypeModifiedWatcher(scope) {
    if (scope.otDoc && scope.contentType) {
      return scope.otDoc.version > scope.contentType.getPublishedVersion() + 1;
    } else {
      return undefined;
    }
  }, function (modified, old, scope) {
    if (modified !== undefined) scope.tab.dirty = modified;
  });

  var firstValidate = $scope.$on('otBecameEditable', function (event) {
    var scope = event.currentScope;
    if (!_.isEmpty(scope.contentType.data.fields)) scope.validate();
    firstValidate();
    firstValidate = null;
  });

  function sanitizeDisplayField() {
    /*jshint eqnull:true */
    var displayField = ShareJS.peek($scope.otDoc, ['displayField']);
    var valid = displayField == null || _.any($scope.contentType.data.fields, {id: displayField});
    if (!valid) {
      var cb = $q.callback();
      $scope.otDoc.at('displayField').set(null, cb);
      return cb.promise.then(function(){
        $scope.otUpdateEntity();
      });
    }
    return $q.when();
  }

  $scope.updatePublishedContentType = function (publishedContentType) {
    $scope.publishedContentType = publishedContentType;
  };

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

  $scope.addField = function(typeFieldTemplate) {
    var fieldDoc = $scope.otDoc.at(['fields']);

    var newField = _.extend({
      name: '',
      id: random.id(),
      type: 'String',
      apiName: ''
    }, typeFieldTemplate);

    fieldDoc.push(newField, function(err, ops) {
      $scope.$apply(function(scope) {
        if (err) {
          logger.logServerError('Could not add field', {error: err });
          notification.error('Could not add field');
        } else {
            scope.otUpdateEntity();
            scope.$broadcast('fieldAdded', ops[0].p[1]);
            analytics.modifiedContentType('Modified ContentType', scope.contentType, newField, 'add');
        }
      });
    });
  };

}]);
